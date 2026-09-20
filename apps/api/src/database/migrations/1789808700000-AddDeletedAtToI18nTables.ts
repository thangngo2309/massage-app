import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToI18nTables1789808700000 implements MigrationInterface {
  name = 'AddDeletedAtToI18nTables1789808700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "i18n_languages"
      ADD COLUMN IF NOT EXISTS "deleted_at"
      TIMESTAMP WITH TIME ZONE NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "i18n_resources"
      ADD COLUMN IF NOT EXISTS "deleted_at"
      TIMESTAMP WITH TIME ZONE NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "i18n_resources"
      DROP COLUMN IF EXISTS "deleted_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "i18n_languages"
      DROP COLUMN IF EXISTS "deleted_at"
    `);
  }
}
