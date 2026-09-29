import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvatarStoragePath2026092900010 implements MigrationInterface {
  name = 'AddUserAvatarStoragePath2026092900010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "avatar_storage_path" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "avatar_storage_path"
    `);
  }
}
