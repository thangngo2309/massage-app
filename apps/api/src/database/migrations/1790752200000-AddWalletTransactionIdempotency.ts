import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWalletTransactionIdempotency1790752200000 implements MigrationInterface {
  name = 'AddWalletTransactionIdempotency1790752200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS
        "UQ_wallet_transactions_wallet_type_reference"
      ON "wallet_transactions" (
        "wallet_id",
        "type",
        "reference_id"
      )
      WHERE
        "reference_id" IS NOT NULL
        AND "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS
        "UQ_wallet_transactions_wallet_type_reference"
    `);
  }
}
