import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeDocumentOrderIndex2026040500000 implements MigrationInterface {
	name = 'NormalizeDocumentOrderIndex2026040500000'

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			WITH ranked AS (
				SELECT
					id,
					ROW_NUMBER() OVER (
						PARTITION BY type, category_id, subcategory_id
						ORDER BY
							COALESCE("orderIndex", 2147483647) ASC,
							"createdAt" ASC,
							id ASC
					) - 1 AS rn
				FROM documents
			)
			UPDATE documents d
			SET "orderIndex" = ranked.rn
			FROM ranked
			WHERE d.id = ranked.id
		`);
	}

	public async down(_queryRunner: QueryRunner): Promise<void> {
		// This migration only normalizes display order. Reverting would require restoring
		// the previous per-document order state, which is not available here.
	}
}