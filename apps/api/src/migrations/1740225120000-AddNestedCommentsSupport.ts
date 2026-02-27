import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddNestedCommentsSupport1740225120000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add parentCommentId column
    await queryRunner.addColumn(
      'comments',
      new TableColumn({
        name: 'parentCommentId',
        type: 'int',
        isNullable: true,
        default: null,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['parentCommentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'comments',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('comments');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.includes('parentCommentId'),
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('comments', foreignKey);
    }

    // Drop column
    await queryRunner.dropColumn('comments', 'parentCommentId');
  }
}
