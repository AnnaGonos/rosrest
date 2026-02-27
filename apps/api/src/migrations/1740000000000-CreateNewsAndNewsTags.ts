import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateNewsAndNewsTags1740000000000 implements MigrationInterface {
  name = 'CreateNewsAndNewsTags1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаём таблицу news_tags
    await queryRunner.createTable(
      new Table({
        name: 'news_tags',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Создаём таблицу news
    await queryRunner.createTable(
      new Table({
        name: 'news',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'previewImage',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'pageId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Создаём внешний ключ для news -> page
    await queryRunner.createForeignKey(
      'news',
      new TableForeignKey({
        columnNames: ['pageId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'page',
        onDelete: 'CASCADE',
      }),
    );

    // Создаём промежуточную таблицу news_tags_relation
    await queryRunner.createTable(
      new Table({
        name: 'news_tags_relation',
        columns: [
          {
            name: 'newsId',
            type: 'uuid',
          },
          {
            name: 'tagId',
            type: 'int',
          },
        ],
      }),
      true,
    );

    // Добавляем составной первичный ключ
    await queryRunner.query(
      'ALTER TABLE "news_tags_relation" ADD PRIMARY KEY ("newsId", "tagId")',
    );

    // Внешний ключ к news
    await queryRunner.createForeignKey(
      'news_tags_relation',
      new TableForeignKey({
        columnNames: ['newsId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'news',
        onDelete: 'CASCADE',
      }),
    );

    // Внешний ключ к news_tags
    await queryRunner.createForeignKey(
      'news_tags_relation',
      new TableForeignKey({
        columnNames: ['tagId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'news_tags',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем таблицу news_tags_relation
    await queryRunner.dropTable('news_tags_relation', true);

    // Удаляем таблицу news
    await queryRunner.dropTable('news', true);

    // Удаляем таблицу news_tags
    await queryRunner.dropTable('news_tags', true);
  }
}

export default CreateNewsAndNewsTags1740000000000;
