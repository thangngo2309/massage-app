import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import {
  App,
  cert,
  getApps,
  initializeApp,
  ServiceAccount,
} from 'firebase-admin/app';

import { getMessaging, Messaging } from 'firebase-admin/messaging';

import { createSign, randomUUID } from 'node:crypto';

interface RawFirebaseServiceAccount {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

interface ParsedFirebaseServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

interface GoogleOAuthTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
}

interface GoogleStorageBucketResponse {
  name?: string;
}

export interface FirebaseUploadImageInput {
  buffer: Buffer;

  mimeType: string;

  storagePath: string;

  metadata?: Record<string, string>;
}

export interface FirebaseUploadImageResult {
  storagePath: string;

  imageUrl: string;
}

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);

  private readonly app: App;

  private readonly bucketName: string;

  private readonly environment: string;

  /**
   * Service account được giữ lại để tự tạo OAuth JWT
   * cho Google Cloud Storage REST API.
   */
  private readonly serviceAccount: ParsedFirebaseServiceAccount;

  /**
   * Cache OAuth access token.
   *
   * Google access token thường có thời hạn khoảng 1 giờ.
   * Ta cache lại để không phải request token mỗi lần upload/delete.
   */
  private accessToken: string | null = null;

  private accessTokenExpiresAt = 0;

  /**
   * Tránh nhiều request đồng thời cùng refresh token.
   */
  private accessTokenPromise: Promise<string> | null = null;

  constructor() {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    const bucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim();

    this.environment =
      process.env.FIREBASE_STORAGE_ENV?.trim() || 'development';

    if (!serviceAccountBase64) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not configured');
    }

    if (!bucketName) {
      throw new Error('FIREBASE_STORAGE_BUCKET is not configured');
    }

    this.bucketName = bucketName;

    this.serviceAccount = this.parseServiceAccount(serviceAccountBase64);

    const existingApp = getApps().find(
      (app) => app.name === 'massage-platform',
    );

    if (existingApp) {
      this.app = existingApp;
    } else {
      this.app = initializeApp(
        {
          /**
           * Firebase Admin vẫn sử dụng certificate credential
           * bình thường cho Messaging và các Firebase service khác.
           *
           * Riêng Cloud Storage trong service này sẽ dùng REST API
           * thông qua native fetch của Node.js.
           */
          credential: cert(this.serviceAccount as ServiceAccount),

          storageBucket: this.bucketName,
        },
        'massage-platform',
      );
    }

    this.logger.log(
      [
        'Firebase initialized.',
        `Project=${this.serviceAccount.projectId}`,
        `Bucket=${this.bucketName}`,
        `Environment=${this.environment}`,
        'StorageTransport=native-fetch',
      ].join(' '),
    );
  }

  // ============================================================
  // PUBLIC ACCESSORS
  // ============================================================

  getApp(): App {
    return this.app;
  }

  getMessaging(): Messaging {
    return getMessaging(this.app);
  }

  getEnvironment(): string {
    return this.environment;
  }

  // ============================================================
  // IMAGE UPLOAD
  // ============================================================

  async uploadImage(
    input: FirebaseUploadImageInput,
  ): Promise<FirebaseUploadImageResult> {
    const { buffer, mimeType, storagePath, metadata } = input;

    if (!buffer?.length) {
      throw new Error('Firebase upload buffer is empty');
    }

    if (!storagePath?.trim()) {
      throw new Error('Firebase storage path is required');
    }

    if (!mimeType?.trim()) {
      throw new Error('Firebase MIME type is required');
    }

    const normalizedStoragePath = storagePath.trim();

    const normalizedMimeType = mimeType.trim();

    const downloadToken = randomUUID();

    try {
      const accessToken = await this.getStorageAccessToken();

      /**
       * Dùng Google Cloud Storage JSON API multipart upload.
       *
       * Multipart cho phép upload:
       *
       * - binary image
       * - contentType
       * - custom metadata
       *
       * trong cùng một request.
       *
       * firebaseStorageDownloadTokens phải nằm trong metadata
       * để Firebase download URL có thể truy cập file bằng token.
       */
      const boundary = `massage-firebase-${randomUUID()}`;

      const objectMetadata = {
        name: normalizedStoragePath,

        contentType: normalizedMimeType,

        metadata: {
          ...(metadata ?? {}),

          firebaseStorageDownloadTokens: downloadToken,
        },
      };

      const multipartBody = this.buildMultipartUploadBody(
        boundary,
        objectMetadata,
        buffer,
        normalizedMimeType,
      );

      const url =
        'https://storage.googleapis.com/upload/storage/v1/b/' +
        `${encodeURIComponent(this.bucketName)}/o` +
        '?uploadType=multipart';

      const response = await fetch(url, {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${accessToken}`,

          'Content-Type': `multipart/related; boundary=${boundary}`,

          'Content-Length': String(multipartBody.length),
        },

        body: new Uint8Array(multipartBody),
      });

      if (!response.ok) {
        const responseBody = await response.text();

        throw new Error(
          [
            'Google Cloud Storage upload failed.',
            `HTTP=${response.status}`,
            `Path=${normalizedStoragePath}`,
            `Response=${responseBody}`,
          ].join(' '),
        );
      }

      const imageUrl = this.buildDownloadUrl(
        this.bucketName,
        normalizedStoragePath,
        downloadToken,
      );

      this.logger.log(`Firebase upload successful: ${normalizedStoragePath}`);

      return {
        storagePath: normalizedStoragePath,

        imageUrl,
      };
    } catch (error) {
      this.logger.error(
        `Firebase upload failed: ${normalizedStoragePath}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Không thể tải hình ảnh lên hệ thống lưu trữ',
      );
    }
  }

  // ============================================================
  // DELETE FILE
  // ============================================================

  async deleteFile(storagePath: string): Promise<void> {
    if (!storagePath?.trim()) {
      return;
    }

    const normalizedStoragePath = storagePath.trim();

    try {
      const accessToken = await this.getStorageAccessToken();

      const encodedObjectName = encodeURIComponent(normalizedStoragePath);

      const url =
        'https://storage.googleapis.com/storage/v1/b/' +
        `${encodeURIComponent(this.bucketName)}` +
        `/o/${encodedObjectName}`;

      const response = await fetch(url, {
        method: 'DELETE',

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      /**
       * Google Storage trả:
       *
       * 204 = xóa thành công
       * 404 = file không còn tồn tại
       *
       * 404 được coi như thành công để giữ hành vi
       * tương đương ignoreNotFound: true trước đây.
       */
      if (!response.ok && response.status !== 404) {
        const responseBody = await response.text();

        throw new Error(
          [
            'Google Cloud Storage delete failed.',
            `HTTP=${response.status}`,
            `Path=${normalizedStoragePath}`,
            `Response=${responseBody}`,
          ].join(' '),
        );
      }

      this.logger.log(`Firebase file deleted: ${normalizedStoragePath}`);
    } catch (error) {
      this.logger.error(
        `Firebase delete failed: ${normalizedStoragePath}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Không thể xóa hình ảnh khỏi hệ thống lưu trữ',
      );
    }
  }

  // ============================================================
  // TEMPORARY DEBUG - AUTHENTICATION
  // ============================================================

  /**
   * Test đúng authentication path mà Storage REST
   * đang sử dụng.
   *
   * Có thể xóa method này sau khi hoàn tất debug.
   */
  async testAuthentication(): Promise<{
    success: boolean;

    expiresIn: number;
  }> {
    try {
      const token = await this.requestGoogleAccessToken();

      this.logger.log(
        [
          'Google OAuth authentication successful.',
          `ExpiresIn=${token.expiresIn}`,
        ].join(' '),
      );

      return {
        success: true,

        expiresIn: token.expiresIn,
      };
    } catch (error) {
      this.logger.error(
        'Google OAuth authentication failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }

  // ============================================================
  // TEMPORARY DEBUG - STORAGE
  // ============================================================

  /**
   * Test Storage bằng chính native fetch transport
   * đang được uploadImage/deleteFile sử dụng.
   *
   * Không upload hoặc thay đổi file.
   *
   * Có thể xóa sau khi hoàn tất debug.
   */
  async testStorage(): Promise<{
    success: boolean;

    bucket: string;

    exists: boolean;
  }> {
    try {
      const accessToken = await this.getStorageAccessToken();

      const url =
        'https://storage.googleapis.com/storage/v1/b/' +
        encodeURIComponent(this.bucketName);

      const response = await fetch(url, {
        method: 'GET',

        headers: {
          Authorization: `Bearer ${accessToken}`,

          Accept: 'application/json',
        },
      });

      if (response.status === 404) {
        return {
          success: true,

          bucket: this.bucketName,

          exists: false,
        };
      }

      if (!response.ok) {
        const responseBody = await response.text();

        throw new Error(
          [
            'Google Cloud Storage test failed.',
            `HTTP=${response.status}`,
            `Bucket=${this.bucketName}`,
            `Response=${responseBody}`,
          ].join(' '),
        );
      }

      const result = (await response.json()) as GoogleStorageBucketResponse;

      this.logger.log(
        [
          'Firebase Storage REST test successful.',
          `Bucket=${result.name ?? this.bucketName}`,
          'Exists=true',
        ].join(' '),
      );

      return {
        success: true,

        bucket: result.name ?? this.bucketName,

        exists: true,
      };
    } catch (error) {
      this.logger.error(
        [
          'Firebase Storage REST test failed.',
          `Bucket=${this.bucketName}`,
        ].join(' '),
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }

  // ============================================================
  // PRIVATE - GOOGLE OAUTH TOKEN
  // ============================================================

  /**
   * Trả về access token đang cache.
   *
   * Token sẽ được refresh trước khi hết hạn.
   */
  private async getStorageAccessToken(): Promise<string> {
    const now = Date.now();

    /**
     * Token còn trên 5 phút thì tiếp tục sử dụng.
     */
    if (this.accessToken && this.accessTokenExpiresAt > now + 5 * 60 * 1000) {
      return this.accessToken;
    }

    /**
     * Nếu một request khác đang refresh token,
     * dùng chung Promise đó thay vì tạo thêm OAuth request.
     */
    if (this.accessTokenPromise) {
      return this.accessTokenPromise;
    }

    this.accessTokenPromise = this.refreshStorageAccessToken();

    try {
      return await this.accessTokenPromise;
    } finally {
      this.accessTokenPromise = null;
    }
  }

  private async refreshStorageAccessToken(): Promise<string> {
    const result = await this.requestGoogleAccessToken();

    this.accessToken = result.accessToken;

    /**
     * Lưu đúng thời điểm hết hạn thực tế.
     *
     * getStorageAccessToken() sẽ tự refresh trước 5 phút.
     */
    this.accessTokenExpiresAt = Date.now() + result.expiresIn * 1000;

    return result.accessToken;
  }

  /**
   * Tạo service-account JWT và đổi lấy OAuth access token
   * bằng native fetch của Node.js.
   *
   * Không đi qua:
   *
   * google-auth-library@9
   * gaxios@6
   * node-fetch@2
   */
  private async requestGoogleAccessToken(): Promise<{
    accessToken: string;

    expiresIn: number;
  }> {
    const now = Math.floor(Date.now() / 1000);

    const jwtHeader = {
      alg: 'RS256',

      typ: 'JWT',
    };

    const jwtPayload = {
      iss: this.serviceAccount.clientEmail,

      /**
       * Full control chỉ áp dụng cho Cloud Storage.
       *
       * IAM vẫn quyết định service account thực tế
       * được phép làm gì trên bucket.
       */
      scope: 'https://www.googleapis.com/auth/devstorage.full_control',

      aud: 'https://oauth2.googleapis.com/token',

      iat: now,

      exp: now + 60 * 60,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(jwtHeader));

    const encodedPayload = this.base64UrlEncode(JSON.stringify(jwtPayload));

    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const signer = createSign('RSA-SHA256');

    signer.update(unsignedToken);

    signer.end();

    const signature = signer.sign(this.serviceAccount.privateKey);

    const assertion = `${unsignedToken}.` + this.base64UrlEncode(signature);

    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',

      assertion,
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',

        Accept: 'application/json',
      },

      body: body.toString(),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        [
          'Google OAuth token request failed.',
          `HTTP=${response.status}`,
          `Response=${responseText}`,
        ].join(' '),
      );
    }

    let result: GoogleOAuthTokenResponse;

    try {
      result = JSON.parse(responseText) as GoogleOAuthTokenResponse;
    } catch {
      throw new Error('Google OAuth token response is invalid JSON');
    }

    if (!result.access_token) {
      throw new Error('Google OAuth response does not contain access_token');
    }

    const expiresIn = Number(result.expires_in) || 3600;

    return {
      accessToken: result.access_token,

      expiresIn,
    };
  }

  // ============================================================
  // PRIVATE - MULTIPART STORAGE UPLOAD
  // ============================================================

  private buildMultipartUploadBody(
    boundary: string,

    metadata: Record<string, unknown>,

    buffer: Buffer,

    mimeType: string,
  ): Buffer {
    const metadataPart = Buffer.from(
      [
        `--${boundary}\r\n`,

        'Content-Type: application/json; charset=UTF-8\r\n',

        '\r\n',

        JSON.stringify(metadata),

        '\r\n',

        `--${boundary}\r\n`,

        `Content-Type: ${mimeType}\r\n`,

        '\r\n',
      ].join(''),
      'utf8',
    );

    const closingPart = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');

    return Buffer.concat([metadataPart, buffer, closingPart]);
  }

  // ============================================================
  // PRIVATE - SERVICE ACCOUNT
  // ============================================================

  private parseServiceAccount(
    serviceAccountBase64: string,
  ): ParsedFirebaseServiceAccount {
    try {
      const json = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');

      const raw = JSON.parse(json) as RawFirebaseServiceAccount;

      const projectId = raw.project_id?.trim();

      const clientEmail = raw.client_email?.trim();

      const privateKey = raw.private_key?.trim();

      if (!projectId) {
        throw new Error('Firebase service account project_id is missing');
      }

      if (!clientEmail) {
        throw new Error('Firebase service account client_email is missing');
      }

      if (!privateKey) {
        throw new Error('Firebase service account private_key is missing');
      }

      if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        throw new Error(
          'Firebase service account private_key has invalid header',
        );
      }

      if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
        throw new Error(
          'Firebase service account private_key has invalid footer',
        );
      }

      return {
        projectId,

        clientEmail,

        privateKey,
      };
    } catch (error) {
      this.logger.error(
        'Cannot parse Firebase service account JSON',
        error instanceof Error ? error.stack : String(error),
      );

      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is invalid');
    }
  }

  // ============================================================
  // PRIVATE - BASE64 URL
  // ============================================================

  private base64UrlEncode(value: string | Buffer): string {
    const buffer =
      typeof value === 'string' ? Buffer.from(value, 'utf8') : value;

    return buffer
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  // ============================================================
  // PRIVATE - DOWNLOAD URL
  // ============================================================

  private buildDownloadUrl(
    bucketName: string,

    storagePath: string,

    downloadToken: string,
  ): string {
    const encodedPath = encodeURIComponent(storagePath);

    return (
      'https://firebasestorage.googleapis.com/v0/b/' +
      `${bucketName}/o/${encodedPath}` +
      `?alt=media&token=${downloadToken}`
    );
  }
}
