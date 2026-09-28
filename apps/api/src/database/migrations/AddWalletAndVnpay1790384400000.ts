import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWalletAndVnpay1790384400000 implements MigrationInterface {
  name = 'AddWalletAndVnpay1790384400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TYPE "wallet_type_enum"
        AS ENUM ('main')
      `);

    await queryRunner.query(`
        CREATE TYPE "wallet_transaction_type_enum"
        AS ENUM (
          'topup',
          'withdraw',
          'payment',
          'refund',
          'adjustment'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "vnpay_transaction_status_enum"
        AS ENUM (
          'pending',
          'success',
          'fail'
        )
      `);

    await queryRunner.query(`
        CREATE TABLE "wallets" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "user_id" integer NOT NULL,
          "type" "wallet_type_enum" NOT NULL DEFAULT 'main',
          "balance" numeric(15,2) NOT NULL DEFAULT 0,
  
          CONSTRAINT "PK_wallets"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "FK_wallets_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE UNIQUE INDEX "UQ_wallets_user_type"
        ON "wallets" ("user_id", "type")
      `);

    await queryRunner.query(`
        CREATE TABLE "wallet_transactions" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "wallet_id" integer NOT NULL,
          "amount" numeric(15,2) NOT NULL,
          "type" "wallet_transaction_type_enum" NOT NULL,
          "reference_id" varchar(100),
          "description" varchar(255),
  
          CONSTRAINT "PK_wallet_transactions"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "FK_wallet_transactions_wallet"
            FOREIGN KEY ("wallet_id")
            REFERENCES "wallets"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "IDX_wallet_transactions_wallet_id"
        ON "wallet_transactions" ("wallet_id")
      `);

    await queryRunner.query(`
        CREATE INDEX "IDX_wallet_transactions_reference_id"
        ON "wallet_transactions" ("reference_id")
      `);

    await queryRunner.query(`
        CREATE TABLE "vnpay_transactions" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "user_id" integer NOT NULL,
          "txn_ref" varchar(100) NOT NULL,
          "amount" numeric(15,2) NOT NULL,
          "bank_code" varchar(50),
          "status" "vnpay_transaction_status_enum"
            NOT NULL DEFAULT 'pending',
          "processed_to_wallet" boolean
            NOT NULL DEFAULT false,
          "vnp_transaction_no" varchar(100),
          "vnp_response_code" varchar(10),
  
          CONSTRAINT "PK_vnpay_transactions"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "FK_vnpay_transactions_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE UNIQUE INDEX
          "UQ_vnpay_transactions_txn_ref"
        ON "vnpay_transactions" ("txn_ref")
      `);

    await queryRunner.query(`
        CREATE INDEX
          "IDX_vnpay_transactions_user_id"
        ON "vnpay_transactions" ("user_id")
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP INDEX IF EXISTS
        "IDX_vnpay_transactions_user_id"
      `);

    await queryRunner.query(`
        DROP INDEX IF EXISTS
        "UQ_vnpay_transactions_txn_ref"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "vnpay_transactions"
      `);

    await queryRunner.query(`
        DROP INDEX IF EXISTS
        "IDX_wallet_transactions_reference_id"
      `);

    await queryRunner.query(`
        DROP INDEX IF EXISTS
        "IDX_wallet_transactions_wallet_id"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "wallet_transactions"
      `);

    await queryRunner.query(`
        DROP INDEX IF EXISTS
        "UQ_wallets_user_type"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "wallets"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "vnpay_transaction_status_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "wallet_transaction_type_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "wallet_type_enum"
      `);
  }
}
