import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import * as path from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

const cookieParser = require('cookie-parser');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

	app.use(helmet({
		contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
		crossOriginEmbedderPolicy: false,
		crossOriginResourcePolicy: { policy: 'cross-origin' }, 
	}));

	const allowedOrigins = process.env.NODE_ENV === 'production'
		? (process.env.CORS_ORIGIN || '').split(',')
		: ['http://localhost:3000', 'http://localhost:3001'];

	app.enableCors({
		origin: allowedOrigins,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: false,
			transform: true,
		}),
	);

	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

	app.use(cookieParser());

	const uploadsPath = path.join(__dirname, '..', 'uploads');
	console.log(`[Uploads] Serving static files from: ${uploadsPath}`);

	app.useStaticAssets(uploadsPath, {
		prefix: '/uploads',
	});

	const config = new DocumentBuilder()
		.setTitle('ROSREST API')
		.setDescription('API documentation')
		.setVersion('1.0.0')
		.addCookieAuth('admin_session', {
			type: 'apiKey',
			in: 'cookie',
		})
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, document);

	const port = parseInt(process.env.PORT || '3002', 10);
	await app.listen(port);
	console.log(`[API] Listening on http://localhost:${port}`);
	console.log(`[Swagger] http://localhost:${port}/api/docs`);
}

bootstrap();


