import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilesTable20260311 implements MigrationInterface {
  name = 'CreateFilesTable20260311';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "originalName" varchar(255) NOT NULL,
        "url" text NOT NULL,
        "mimetype" varchar(100) NOT NULL,
        "size" integer NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "files"`);
  }
}
