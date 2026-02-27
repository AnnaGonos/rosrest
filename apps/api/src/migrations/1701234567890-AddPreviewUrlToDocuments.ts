import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPreviewUrlToDocuments1701234567890 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.addColumn(
			'documents',
			new TableColumn({
				name: 'previewUrl',
				type: 'text',
				isNullable: true,
				default: null,
			}),
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropColumn('documents', 'previewUrl');
	}
}
