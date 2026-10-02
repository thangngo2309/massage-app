import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingDiscountCompensationWalletTransactionType1790874400000 implements MigrationInterface {
  name = 'AddBookingDiscountCompensationWalletTransactionType1790874400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "wallet_transaction_type_enum"
      ADD VALUE IF NOT EXISTS 'booking_discount_compensation'
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    /**
     * PostgreSQL không hỗ trợ DROP VALUE trực tiếp khỏi enum
     * theo cách an toàn.
     *
     * Vì vậy giữ lại enum value khi rollback.
     */
  }
}
