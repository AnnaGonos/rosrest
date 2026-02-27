"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = void 0;
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Загрузка переменных окружения из корня проекта
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
// Конфигурация для РАЗРАБОТКИ
const developmentConfig = {
    type: 'postgres',
    host: process.env.DB_DEV_HOST || 'localhost',
    port: parseInt(process.env.DB_DEV_PORT || '5432', 10),
    username: process.env.DB_DEV_USER || 'postgres',
    password: process.env.DB_DEV_PASSWORD || 'postgres',
    database: process.env.DB_DEV_NAME || 'rosrest_dev',
    entities: ['src/**/*.entity{.ts,.js}'],
    migrations: ['src/migrations/**/*{.ts,.js}'],
    synchronize: true, // Автоматическая синхронизация схемы (только для разработки!)
    logging: true,
    ssl: false,
};
// Конфигурация для ПРОДАКШЕНА
const productionConfig = {
    type: 'postgres',
    host: process.env.DB_PROD_HOST || 'localhost',
    port: parseInt(process.env.DB_PROD_PORT || '5432', 10),
    username: process.env.DB_PROD_USER || 'postgres',
    password: process.env.DB_PROD_PASSWORD || 'postgres',
    database: process.env.DB_PROD_NAME || 'rosrest_prod',
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/**/*.js'],
    synchronize: false, // ВАЖНО: Отключено для продакшена! Используйте миграции!
    logging: false,
    ssl: process.env.DB_PROD_SSL === 'true' ? { rejectUnauthorized: false } : false,
    // Оптимизации для продакшена
    extra: {
        max: 20, // Максимум соединений в пуле
        min: 5, // Минимум соединений в пуле
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    },
};
// Выбор конфигурации в зависимости от окружения
exports.dataSourceOptions = isProduction
    ? productionConfig
    : developmentConfig;
const dataSource = new typeorm_1.DataSource(exports.dataSourceOptions);
exports.default = dataSource;
