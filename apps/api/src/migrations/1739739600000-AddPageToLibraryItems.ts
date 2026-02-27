import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm'

export class AddPageToLibraryItems1739739600000 implements MigrationInterface {
  name = 'AddPageToLibraryItems1739739600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавляем колонку pageId в library_items
    await queryRunner.addColumn(
      'library_items',
      new TableColumn({
        name: 'pageId',
        type: 'uuid',
        isNullable: true,
      }),
    )

    // Создаем внешний ключ
    await queryRunner.createForeignKey(
      'library_items',
      new TableForeignKey({
        columnNames: ['pageId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'page',
        onDelete: 'CASCADE',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем внешний ключ
    const table = await queryRunner.getTable('library_items')
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('pageId') !== -1)
    if (foreignKey) {
      await queryRunner.dropForeignKey('library_items', foreignKey)
    }

    // Удаляем колонку
    await queryRunner.dropColumn('library_items', 'pageId')
  }
}

export default AddPageToLibraryItems1739739600000
