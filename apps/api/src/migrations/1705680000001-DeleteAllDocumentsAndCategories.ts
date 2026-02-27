import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteAllDocumentsAndCategories1705680000001 implements MigrationInterface {
    name = 'DeleteAllDocumentsAndCategories1705680000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Deletes all documents and all document categories.
        // This runs inside a transaction so it can be rolled back if something goes wrong.
        await queryRunner.query(`BEGIN`);
        try {
            // Delete documents first to avoid FK violations
            await queryRunner.query(`DELETE FROM documents`);

            // Then delete all categories
            await queryRunner.query(`DELETE FROM document_categories`);

            await queryRunner.query(`COMMIT`);
        } catch (err) {
            await queryRunner.query(`ROLLBACK`);
            throw err;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Irreversible: deleted rows cannot be restored by this migration.
        // Intentionally left blank.
    }
}

export default DeleteAllDocumentsAndCategories1705680000001;
