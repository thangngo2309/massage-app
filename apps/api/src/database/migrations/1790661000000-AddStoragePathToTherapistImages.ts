import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoragePathToTherapistImages1790661000000 implements MigrationInterface {
  name = 'AddStoragePathToTherapistImages1790661000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "therapist_images"
        ADD COLUMN "storage_path" text NOT NULL
      `);

    await queryRunner.query(`
        CREATE UNIQUE INDEX "uq_therapist_images_storage_path"
        ON "therapist_images" ("storage_path")
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP INDEX IF EXISTS "uq_therapist_images_storage_path"
      `);

    await queryRunner.query(`
        ALTER TABLE "therapist_images"
        DROP COLUMN "storage_path"
      `);
  }
}
