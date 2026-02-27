import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDuplicateCategories1705680000000 implements MigrationInterface {
  name = 'RemoveDuplicateCategories1705680000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`BEGIN`);

        // Delete duplicate categories keeping the lowest id for each name,
        // but only remove those that have no child categories and are not referenced by documents.
        await queryRunner.query(`
            WITH dup AS (
              SELECT id, name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) rn
              FROM document_categories
            ),
            candidates AS (
              SELECT id FROM dup WHERE rn > 1
            )
            DELETE FROM document_categories c
            USING candidates cand
            WHERE c.id = cand.id
              AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.category_id = c.id OR d.subcategory_id = c.id)
              AND NOT EXISTS (SELECT 1 FROM document_categories ch WHERE ch."parentId" = c.id)
        `);

        // Add unique constraint on name (will fail if any remaining duplicates exist)
        await queryRunner.query(`ALTER TABLE document_categories ADD CONSTRAINT UQ_document_categories_name UNIQUE (name)`);

        await queryRunner.query(`COMMIT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the unique constraint; deleted categories cannot be restored by down migration
        await queryRunner.query(`ALTER TABLE document_categories DROP CONSTRAINT IF EXISTS UQ_document_categories_name`);
    }
}

export default RemoveDuplicateCategories1705680000000;
