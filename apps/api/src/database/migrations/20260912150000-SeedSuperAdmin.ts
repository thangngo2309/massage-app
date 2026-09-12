import { MigrationInterface, QueryRunner } from 'typeorm';

import { hash } from 'bcryptjs';

export class SeedSuperAdmin20260912150000 implements MigrationInterface {
  name = 'SeedSuperAdmin20260912150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const fullName = process.env.SUPER_ADMIN_FULL_NAME || 'Super Admin';
    const rawPhone = process.env.SUPER_ADMIN_PHONE || '0901000000';
    const email = (process.env.SUPER_ADMIN_EMAIL || 'admin@massage.local')
      .trim()
      .toLowerCase();

    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!password) {
      throw new Error('SUPER_ADMIN_PASSWORD is required');
    }

    const phone = this.normalizeVietnamPhone(rawPhone);

    /**
     * Check account tồn tại.
     */
    const existingUsers: Array<{
      id: number;
    }> = await queryRunner.query(
      `
            SELECT "id"
            FROM "users"
            WHERE
              "phone" = $1
              OR LOWER("email") = LOWER($2)
            LIMIT 1
          `,
      [phone, email],
    );

    /**
     * Migration có thể chạy an toàn
     * nếu account đã tồn tại.
     */
    if (existingUsers.length > 0) {
      return;
    }

    const passwordHash = await hash(password, 12);

    await queryRunner.query(
      `
          INSERT INTO "users" (
            "phone",
            "email",
            "password_hash",
            "full_name",
            "role",
            "status",
            "created_at",
            "updated_at"
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            'super_admin',
            'active',
            NOW(),
            NOW()
          )
        `,
      [phone, email, passwordHash, fullName],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rawPhone = process.env.SUPER_ADMIN_PHONE || '0901000000';

    const email = (process.env.SUPER_ADMIN_EMAIL || 'admin@massage.local')
      .trim()
      .toLowerCase();

    const phone = this.normalizeVietnamPhone(rawPhone);

    await queryRunner.query(
      `
          DELETE FROM "users"
          WHERE
            "role" = 'super_admin'
            AND (
              "phone" = $1
              OR LOWER("email") = LOWER($2)
            )
        `,
      [phone, email],
    );
  }

  private normalizeVietnamPhone(value: string): string {
    let phone = value.trim().replace(/\s+/g, '').replace(/[.-]/g, '');

    if (phone.startsWith('0')) {
      phone = `+84${phone.substring(1)}`;
    } else if (phone.startsWith('84')) {
      phone = `+${phone}`;
    }

    if (!/^\+84\d{9}$/.test(phone)) {
      throw new Error(`Invalid SUPER_ADMIN_PHONE: ${value}`);
    }

    return phone;
  }
}
