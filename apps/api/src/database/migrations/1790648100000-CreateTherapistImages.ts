import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTherapistImages1790648100000 implements MigrationInterface {
  name = 'CreateTherapistImages1790648100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "therapist_images" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "therapist_id" integer NOT NULL,
        "image_url" text NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,

        CONSTRAINT "pk_therapist_images"
          PRIMARY KEY ("id"),

        CONSTRAINT "fk_therapist_images_therapist_id"
          FOREIGN KEY ("therapist_id")
          REFERENCES "therapist_profiles"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_therapist_images_therapist_id"
      ON "therapist_images" ("therapist_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_therapist_images_therapist_sort"
      ON "therapist_images" ("therapist_id", "sort_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_therapist_images_therapist_sort"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_therapist_images_therapist_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "therapist_images"
    `);
  }
}
