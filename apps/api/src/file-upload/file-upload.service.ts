import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

export type FileType = 'image' | 'pdf' | 'doc';

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
		} else if (type === 'doc') {
			return await this.uploadDoc(file, subfolder);
		}

		throw new BadRequestException('Invalid file type');
	}

	private async uploadDoc(file: UploadFile, subfolder?: string): Promise<string> {
		const allowedMimes = [
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		];
		if (!allowedMimes.includes(file.mimetype)) {
			throw new BadRequestException('Можно загружать только DOC или DOCX файлы');
		}

		const maxSize = 20 * 1024 * 1024; // 20MB
		if (file.size > maxSize) {
			throw new BadRequestException('Размер DOC/DOCX не должен превышать 20MB');
		}

		return await this.saveFile(file, subfolder);
	}

	private async uploadImage(file: UploadFile, subfolder?: string): Promise<string> {
		const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
		if (!allowedMimes.includes(file.mimetype)) {
			throw new BadRequestException('Invalid image format. Allowed: jpg, png, gif, webp');
		}

		const maxSize = 150 * 1024 * 1024; // 15MB
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

		   let originalname = file.originalname;
		   
		   if (/^[\xC0-\xFF]/.test(originalname) || /Ð|Ñ|Ò|Ó|Ô|Õ|Ö|×|Ø|Ù|Ú|Û|Ü|Ý|Þ|ß/.test(originalname)) {
			   try {
				   const buf = Buffer.from(originalname, 'latin1');
				   originalname = buf.toString('utf8');
			   } catch (e) {
			   }
		   }
		   let baseName = path.basename(originalname, path.extname(originalname));
		   let ext = path.extname(originalname);
		   // Нормализуем имя файла в NFC (Unicode)
		   baseName = baseName.normalize('NFC');
		   let safeName = `${baseName}${ext}`;
		   let filepath = path.join(targetDir, safeName);
		   // Если файл с таким именем уже есть, добавляем timestamp
		   if (fs.existsSync(filepath)) {
			   safeName = `${baseName}_${Date.now()}${ext}`;
			   filepath = path.join(targetDir, safeName);
		   }
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
		       const collectFiles = (dir: string, urlPrefix: string): any[] => {
			       if (!fs.existsSync(dir)) return [];
			       const entries = fs.readdirSync(dir);
			       let result: any[] = [];
			       for (const entry of entries) {
				       const fullPath = path.join(dir, entry);
				       const stat = fs.statSync(fullPath);
				       if (stat.isFile()) {
					       result.push({
						       filename: entry,
						       url: `${urlPrefix}/${entry}`,
						       size: stat.size,
						       createdAt: stat.birthtime,
					       });
				       } else if (stat.isDirectory()) {
					       result = result.concat(collectFiles(fullPath, `${urlPrefix}/${entry}`));
				       }
			       }
			       return result;
		       };

		       if (subfolder) {
			       const targetDir = path.join(this.uploadDir, subfolder);
			       const urlPrefix = `/uploads/${subfolder}`;
			       return collectFiles(targetDir, urlPrefix).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		       } else {
			       return collectFiles(this.uploadDir, '/uploads').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		       }
	       }
}

