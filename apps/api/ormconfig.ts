
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const env = process.env.NODE_ENV || 'development';
let envPath = path.resolve(__dirname, '../../.env');
if (env === 'production') {
  envPath = path.resolve(__dirname, './prod/.env');
} else if (env === 'test') {
  envPath = path.resolve(__dirname, './test/.env');
}
dotenv.config({ path: envPath });

const isProduction = env === 'production';
const isTest = env === 'test';

const developmentConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_DEV_HOST || 'rosrest_postgres_dev',
  port: parseInt(process.env.DB_DEV_PORT || '5432', 10),
  username: process.env.DB_DEV_USER || 'postgres',
  password: process.env.DB_DEV_PASSWORD || 'postgres',
  database: process.env.DB_DEV_NAME || 'rosrest_dev',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/**/*{.ts,.js}'],
  synchronize: true,
  logging: true,
  ssl: false,
};

const productionConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_PROD_HOST || 'prod-db-host',
  port: parseInt(process.env.DB_PROD_PORT || '5432', 10),
  username: process.env.DB_PROD_USER || 'postgres',
  password: process.env.DB_PROD_PASSWORD || 'postgres',
  database: process.env.DB_PROD_NAME || 'rosrest_prod',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/**/*.js'],
  synchronize: false,
  logging: false,
  ssl: process.env.DB_PROD_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },
};

const testConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_TEST_HOST || 'localhost',
  port: parseInt(process.env.DB_TEST_PORT || '5432', 10),
  username: process.env.DB_TEST_USER || 'postgres',
  password: process.env.DB_TEST_PASSWORD || 'postgres',
  database: process.env.DB_TEST_NAME || 'rosrest_test',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/**/*{.ts,.js}'],
  synchronize: true,
  logging: true,
  ssl: false,
};

export const dataSourceOptions: DataSourceOptions = isProduction
  ? productionConfig
  : isTest
    ? testConfig
    : developmentConfig;

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
