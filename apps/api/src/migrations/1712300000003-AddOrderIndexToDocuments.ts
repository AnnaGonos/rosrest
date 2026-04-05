import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderIndexToDocuments1712300000003 implements MigrationInterface {
  name = 'AddOrderIndexToDocuments1712300000003'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS "orderIndex" integer NOT NULL DEFAULT 0`);

    await queryRunner.query(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY type, category_id, subcategory_id
          ORDER BY "createdAt" DESC
        ) - 1 AS rn
        FROM documents
      )
      UPDATE documents d
      SET "orderIndex" = ranked.rn
      FROM ranked
      WHERE d.id = ranked.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE documents DROP COLUMN IF EXISTS "orderIndex"`);
  }
}
