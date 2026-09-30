import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFirstBookingEligiblePromotionTrigger1790752200000 implements MigrationInterface {
  name = 'AddFirstBookingEligiblePromotionTrigger1790752200000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "promotion_trigger_type_enum" ADD VALUE IF NOT EXISTS 'first_booking_eligible'`,
    );
  }
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL không hỗ trợ DROP VALUE an toàn khỏi enum.
  }
}
