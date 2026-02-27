import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateForJournalistTable1708694400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'for_journalist',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'previewImage',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'pageId',
            type: 'uuid',
            isUnique: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'for_journalist',
      new TableForeignKey({
        columnNames: ['pageId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pages',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('for_journalist');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('pageId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('for_journalist', foreignKey);
      }
    }
    await queryRunner.dropTable('for_journalist');
  }
}
