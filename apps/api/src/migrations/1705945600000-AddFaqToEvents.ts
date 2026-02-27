import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddFaqToEvents1705945600000 implements MigrationInterface {
  name = 'AddFaqToEvents1705945600000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'faq',
        type: 'jsonb',
        isNullable: true,
        default: '[]',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('events', 'faq')
  }
}

export default AddFaqToEvents1705945600000
