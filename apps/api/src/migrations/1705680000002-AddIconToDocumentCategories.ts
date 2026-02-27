import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIconToDocumentCategories1705680000002 implements MigrationInterface {
    name = 'AddIconToDocumentCategories1705680000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE document_categories ADD COLUMN IF NOT EXISTS icon varchar(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE document_categories DROP COLUMN IF EXISTS icon`);
    }
}

export default AddIconToDocumentCategories1705680000002;
