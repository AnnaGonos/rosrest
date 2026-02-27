import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeContact } from './entities/employee-contact.entity';
import { FileUploadService } from '../file-upload/file-upload.service';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@Injectable()
export class EmployeeService {
	constructor(
		@InjectRepository(EmployeeContact)
		private readonly employeeRepo: Repository<EmployeeContact>,
	) {}

	async create(dto: CreateEmployeeDto, file?: UploadFile, fileUploadService?: FileUploadService) {
		if (!file && !dto.photoUrl) {
			throw new BadRequestException('Нужно загрузить фото сотрудника или указать ссылку на изображение');
		}

		let photoUrl = '';
		if (file && fileUploadService) {
			photoUrl = await fileUploadService.upload(file, 'image', 'employees/photos');
		} else if (dto.photoUrl) {
			photoUrl = dto.photoUrl;
		}

		const employee = this.employeeRepo.create({
			fullName: dto.fullName,
			position: dto.position,
			email: dto.email,
			phone: dto.phone,
			photoUrl,
			profileUrl: dto.profileUrl,
			orderIndex: dto.orderIndex,
		});

		return this.employeeRepo.save(employee);
	}

	async findAll() {
		return this.employeeRepo.find({ order: { orderIndex: 'ASC' } });
	}

	async findOne(id: string) {
		const employee = await this.employeeRepo.findOne({ where: { id } });
		if (!employee) {
			throw new NotFoundException({
				statusCode: 404,
				message: `Employee with ID ${id} not found`,
				error: 'Not Found',
			});
		}
		return employee;
	}

	async update(id: string, dto: UpdateEmployeeDto, file?: UploadFile, fileUploadService?: FileUploadService) {
		const employee = await this.findOne(id);
		
		if (file && fileUploadService) {
			const uploadedUrl = await fileUploadService.upload(file, 'image', 'employees/photos');
			employee.photoUrl = uploadedUrl;
		} else if (dto.photoUrl !== undefined) {
			employee.photoUrl = dto.photoUrl;
		}

		if (dto.fullName !== undefined) employee.fullName = dto.fullName;
		if (dto.position !== undefined) employee.position = dto.position;
		if (dto.email !== undefined) employee.email = dto.email as any;
		if (dto.phone !== undefined) employee.phone = dto.phone as any;
		if (dto.profileUrl !== undefined) employee.profileUrl = dto.profileUrl as any;
		if (dto.orderIndex !== undefined) employee.orderIndex = dto.orderIndex;

		return this.employeeRepo.save(employee);
	}

	async remove(id: string) {
		await this.findOne(id);
		await this.employeeRepo.delete(id);
		return { deleted: true };
	}
}

