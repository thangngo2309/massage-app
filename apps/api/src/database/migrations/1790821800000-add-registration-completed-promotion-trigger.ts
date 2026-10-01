import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegistrationCompletedPromotionTrigger1790821800000 implements MigrationInterface {
  name = 'AddRegistrationCompletedPromotionTrigger1790821800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "promotion_trigger_type_enum"
      ADD VALUE IF NOT EXISTS 'registration_completed'
    `);
  }

  /**
   * PostgreSQL không hỗ trợ DROP VALUE trực tiếp
   * khỏi enum một cách an toàn.
   *
   * Không rollback enum để tránh recreate type
   * và ảnh hưởng dữ liệu promotions hiện có.
   */
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally empty.
  }
}
