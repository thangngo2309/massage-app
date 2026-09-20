import { Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { JwtService } from '@nestjs/jwt';

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { Repository } from 'typeorm';

import { ClientProfile } from '../entities/client-profile.entity.js';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';

import { UserRole } from '../enums/business.enums.js';
import { ConfigService } from '@nestjs/config';

type SocketAuthUser = {
  sub: number;

  role: UserRole;

  type: 'access';

  iat?: number;

  exp?: number;
};

export type BookingRealtimePayload = {
  id: number;

  clientId: number;

  therapistId: number | null;

  status: string;

  scheduledAt?: string | Date | null;

  updatedAt?: string | Date | null;

  sourceRole?:
    | UserRole.CLIENT
    | UserRole.THERAPIST
    | UserRole.SYSTEM_ADMIN
    | UserRole.SUPER_ADMIN;
};

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:7201', 'http://localhost:7202', 'http://157.66.100.68:7202', 'http://157.66.100.68:7201'],

    credentials: true,
  },
})
export class BookingRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(BookingRealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,

    @InjectRepository(ClientProfile)
    private readonly clientProfileRepository: Repository<ClientProfile>,

    @InjectRepository(TherapistProfile)
    private readonly therapistProfileRepository: Repository<TherapistProfile>,
  ) {}

  /**
   * =========================================
   * CONNECTION
   * =========================================
   */

  async handleConnection(socket: Socket) {
    this.logger.log(`[socket] START socket=${socket.id}`);

    try {
      /**
       * =====================================
       * 1. TOKEN
       * =====================================
       */

      const token = this.getAccessToken(socket);

      if (!token) {
        this.logger.error(`[socket] STOP: NO TOKEN socket=${socket.id}`);

        socket.disconnect(true);

        return;
      }

      this.logger.log(`[socket] TOKEN OK socket=${socket.id}`);

      /**
       * =====================================
       * 2. VERIFY JWT
       * =====================================
       */

      let user: SocketAuthUser;

      try {
        const accessTokenSecret =
          this.configService.get<string>('JWT_ACCESS_SECRET');

        if (!accessTokenSecret) {
          throw new Error('JWT_ACCESS_SECRET is not configured');
        }

        user = await this.jwtService.verifyAsync<SocketAuthUser>(token, {
          secret: accessTokenSecret,
        });
      } catch (error) {
        this.logger.error(
          `[socket] STOP: JWT ERROR socket=${socket.id}`,
          error instanceof Error ? error.stack : String(error),
        );

        socket.disconnect(true);

        return;
      }

      this.logger.log(
        `[socket] JWT OK socket=${socket.id} sub=${user.sub} role=${user.role} type=${user.type}`,
      );

      /**
       * =====================================
       * 3. BASIC JWT DATA
       * =====================================
       */

      if (!user.sub) {
        this.logger.error(`[socket] STOP: NO SUB socket=${socket.id}`);

        socket.disconnect(true);

        return;
      }

      if (user.type !== 'access') {
        this.logger.error(
          `[socket] STOP: INVALID TYPE=${user.type} socket=${socket.id}`,
        );

        socket.disconnect(true);

        return;
      }

      socket.data.user = user;

      /**
       * =====================================
       * 4. USER ROOM
       * =====================================
       */

      await socket.join(`user:${user.sub}`);

      this.logger.log(`[socket] USER ROOM OK user:${user.sub}`);

      /**
       * =====================================
       * 5. CLIENT
       * =====================================
       */

      if (user.role === UserRole.CLIENT) {
        this.logger.log(`[socket] LOOKUP CLIENT userId=${user.sub}`);

        const client = await this.clientProfileRepository.findOne({
          where: {
            userId: user.sub,
          },
        });

        if (!client) {
          this.logger.error(
            `[socket] STOP: CLIENT PROFILE NOT FOUND userId=${user.sub}`,
          );

          socket.disconnect(true);

          return;
        }

        const room = this.getClientRoom(client.id);

        await socket.join(room);

        this.logger.log(`[socket] CLIENT ROOM OK room=${room}`);
      }

      /**
       * =====================================
       * 6. THERAPIST
       * =====================================
       */

      if (user.role === UserRole.THERAPIST) {
        this.logger.log(`[socket] LOOKUP THERAPIST userId=${user.sub}`);

        const therapist = await this.therapistProfileRepository.findOne({
          where: {
            userId: user.sub,
          },
        });

        if (!therapist) {
          this.logger.error(
            `[socket] STOP: THERAPIST PROFILE NOT FOUND userId=${user.sub}`,
          );

          socket.disconnect(true);

          return;
        }

        const room = this.getTherapistRoom(therapist.id);

        await socket.join(room);

        this.logger.log(`[socket] THERAPIST ROOM OK room=${room}`);
      }

      /**
       * =====================================
       * SUCCESS
       * =====================================
       */

      this.logger.log(`[socket] READY socket=${socket.id}`);
    } catch (error) {
      this.logger.error(
        `[socket] STOP: UNKNOWN ERROR socket=${socket.id}`,
        error instanceof Error ? error.stack : String(error),
      );

      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.debug(`Socket disconnected: ${socket.id}`);
  }

  /**
   * =========================================
   * TOKEN
   * =========================================
   */

  private getAccessToken(socket: Socket): string | null {
    /**
     * Cách chính:
     *
     * io(url, {
     *   auth: {
     *     token
     *   }
     * })
     */

    const authToken = socket.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken) {
      return authToken;
    }

    /**
     * Fallback Authorization header.
     */

    const authorization = socket.handshake.headers.authorization;

    if (typeof authorization !== 'string') {
      return null;
    }

    if (!authorization.startsWith('Bearer ')) {
      return null;
    }

    return authorization.slice(7).trim();
  }

  /**
   * =========================================
   * ROOMS
   * =========================================
   */

  private getUserRoom(userId: number) {
    return `user:${userId}`;
  }

  private getClientRoom(clientId: number) {
    return `client:${clientId}`;
  }

  private getTherapistRoom(therapistId: number) {
    return `therapist:${therapistId}`;
  }

  /**
   * =========================================
   * BOOKING CREATED
   * =========================================
   */

  emitBookingCreated(payload: BookingRealtimePayload) {
    /**
     * Client nhận event của chính
     * booking mình vừa tạo.
     */

    this.server
      .to(this.getClientRoom(payload.clientId))
      .emit('booking.created', payload);

    /**
     * Therapist nhận booking mới.
     */

    if (payload.therapistId) {
      this.server
        .to(this.getTherapistRoom(payload.therapistId))
        .emit('booking.created', payload);
    }
  }

  /**
   * =========================================
   * BOOKING UPDATED
   * =========================================
   */

  async emitBookingUpdated(payload: BookingRealtimePayload) {
    const clientRoom = this.getClientRoom(payload.clientId);

    const therapistRoom = payload.therapistId
      ? this.getTherapistRoom(payload.therapistId)
      : null;

    /**
     * =========================================
     * DEBUG ROOM
     * =========================================
     */

    const clientSockets = await this.server.in(clientRoom).fetchSockets();

    this.logger.log(
      `[booking.updated] booking=${payload.id} status=${payload.status} clientRoom=${clientRoom} clientSockets=${clientSockets.length}`,
    );

    /**
     * CLIENT
     */

    this.server.to(clientRoom).emit('booking.updated', payload);

    /**
     * THERAPIST
     */

    if (therapistRoom) {
      const therapistSockets = await this.server
        .in(therapistRoom)
        .fetchSockets();

      this.logger.log(
        `[booking.updated] therapistRoom=${therapistRoom} therapistSockets=${therapistSockets.length}`,
      );

      this.server.to(therapistRoom).emit('booking.updated', payload);
    }
  }
}
