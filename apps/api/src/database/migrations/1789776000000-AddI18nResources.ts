import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddI18nResources202609190001 implements MigrationInterface {
  name = 'AddI18nResources1789776000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "i18n_languages" (
        "id" SERIAL NOT NULL,
        "code" character varying(10) NOT NULL,
        "name" character varying(100) NOT NULL,
        "native_name" character varying(100) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_default" boolean NOT NULL DEFAULT false,
        "revision" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_i18n_languages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_i18n_languages_code"
      ON "i18n_languages" ("code")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_i18n_languages_default"
      ON "i18n_languages" ("is_default")
      WHERE "is_default" = true
    `);

    await queryRunner.query(`
      CREATE TABLE "i18n_resources" (
        "id" SERIAL NOT NULL,
        "language_id" integer NOT NULL,
        "namespace" character varying(100) NOT NULL,
        "key" character varying(255) NOT NULL,
        "value" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_i18n_resources" PRIMARY KEY ("id"),
        CONSTRAINT "FK_i18n_resources_language"
          FOREIGN KEY ("language_id")
          REFERENCES "i18n_languages"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX
      "UQ_i18n_resources_language_namespace_key"
      ON "i18n_resources" (
        "language_id",
        "namespace",
        "key"
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_i18n_resources_language"
      ON "i18n_resources" ("language_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_i18n_resources_namespace"
      ON "i18n_resources" ("namespace")
    `);

    await queryRunner.query(`
      INSERT INTO "i18n_languages"
      (
        "code",
        "name",
        "native_name",
        "is_active",
        "is_default",
        "revision"
      )
      VALUES
        (
          'vi',
          'Vietnamese',
          'Tiếng Việt',
          true,
          true,
          1
        ),
        (
          'en',
          'English',
          'English',
          true,
          false,
          1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "i18n_resources"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "i18n_languages"
    `);
  }
}
