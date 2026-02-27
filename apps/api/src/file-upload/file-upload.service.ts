import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

export type FileType = 'image' | 'pdf';

@Injectable()
export class FileUploadService {
	private readonly uploadDir = path.join(process.cwd(), 'uploads');

	constructor() {
		if (!fs.existsSync(this.uploadDir)) {
			fs.mkdirSync(this.uploadDir, { recursive: true });
		}
	}

	async upload(file: UploadFile, type: FileType, subfolder?: string): Promise<string> {
		if (!file) {
			throw new BadRequestException('No file provided');
		}

		if (type === 'image') {
			return await this.uploadImage(file, subfolder);
		} else if (type === 'pdf') {
			return await this.uploadPdf(file, subfolder);
		}

		throw new BadRequestException('Invalid file type');
	}

	private async uploadImage(file: UploadFile, subfolder?: string): Promise<string> {
		const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
		if (!allowedMimes.includes(file.mimetype)) {
			throw new BadRequestException('Invalid image format. Allowed: jpg, png, gif, webp');
		}

		const maxSize = 15 * 1024 * 1024; // 15MB
		if (file.size > maxSize) {
			throw new BadRequestException('Image size must not exceed 15MB');
		}

		return await this.saveFile(file, subfolder);
	}


	private async uploadPdf(file: UploadFile, subfolder?: string): Promise<string> {
		if (file.mimetype !== 'application/pdf') {
			throw new BadRequestException('Only PDF files are allowed');
		}

		const maxSize = 100 * 1024 * 1024;
		if (file.size > maxSize) {
			throw new BadRequestException('PDF size must not exceed 100MB');
		}

		return await this.saveFile(file, subfolder);
	}

	private async saveFile(file: UploadFile, subfolder?: string): Promise<string> {
		let targetDir = this.uploadDir;
		let urlPrefix = '/uploads';

		if (subfolder) {
			targetDir = path.join(this.uploadDir, subfolder);
			urlPrefix = `/uploads/${subfolder}`;
			if (!fs.existsSync(targetDir)) {
				fs.mkdirSync(targetDir, { recursive: true });
			}
		}

		const ext = path.extname(file.originalname);
		const safeName = `${Date.now()}${ext}`;
		const filepath = path.join(targetDir, safeName);

		await fs.promises.writeFile(filepath, file.buffer);

		return `${urlPrefix}/${safeName}`;
	}

	delete(filePath: string): void {
		if (!filePath) return;

		try {
			const cleanPath = filePath.replace(/^\/uploads\//, '');
			const fullPath = path.join(this.uploadDir, cleanPath);

			if (fs.existsSync(fullPath)) {
				fs.unlinkSync(fullPath);
			}
		} catch (error) {
			console.error('Error deleting file:', error);
		}
	}

	deleteMultiple(filePaths: string[]): void {
		filePaths.forEach((filePath) => this.delete(filePath));
	}

	listFiles(subfolder?: string) {
		const targetDir = subfolder ? path.join(this.uploadDir, subfolder) : this.uploadDir;

		if (!fs.existsSync(targetDir)) {
			return [];
		}

		const files = fs.readdirSync(targetDir);
		const urlPrefix = subfolder ? `/uploads/${subfolder}` : '/uploads';

		return files
			.filter((filename) => {
				const filePath = path.join(targetDir, filename);
				return fs.statSync(filePath).isFile();
			})
			.map((filename) => {
				const filePath = path.join(targetDir, filename);
				const stats = fs.statSync(filePath);

				return {
					filename,
					url: `${urlPrefix}/${filename}`,
					size: stats.size,
					createdAt: stats.birthtime,
				};
			})
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}
}

