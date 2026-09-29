import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTherapistProfileInformation1790647260000 implements MigrationInterface {
  name = 'AddTherapistProfileInformation1790647260000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "therapist_profiles"
      ADD COLUMN "address" text
    `);

    await queryRunner.query(`
      ALTER TABLE "therapist_profiles"
      ADD COLUMN "stage_name" character varying(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "therapist_profiles"
      ADD COLUMN "has_tattoo" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "therapist_profiles"
      DROP COLUMN "has_tattoo"
    `);

    await queryRunner.query(`
      ALTER TABLE "therapist_profiles"
      DROP COLUMN "stage_name"
    `);

    await queryRunner.query(`
      ALTER TABLE "therapist_profiles"
      DROP COLUMN "address"
    `);
  }
}
