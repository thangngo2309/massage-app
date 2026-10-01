import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceDistrictServiceAreaWithWard1790874200000 implements MigrationInterface {
  name = 'ReplaceDistrictServiceAreaWithWard1790874200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "therapist_service_areas"
      RENAME COLUMN "district_code" TO "ward_code"
    `);

    await queryRunner.query(`
      ALTER TYPE "therapist_service_area_type_enum"
      RENAME VALUE 'district' TO 'ward'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "therapist_service_area_type_enum"
      RENAME VALUE 'ward' TO 'district'
    `);

    await queryRunner.query(`
      ALTER TABLE "therapist_service_areas"
      RENAME COLUMN "ward_code" TO "district_code"
    `);
  }
}
