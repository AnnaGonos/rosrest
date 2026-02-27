import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	ParseUUIDPipe,
	UseGuards,
	UseInterceptors,
	UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiCreatedResponse,
	ApiOkResponse,
	ApiResponse,
	ApiTags,
	ApiBearerAuth,
	ApiConsumes,
	ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { EmployeeContact } from './entities/employee-contact.entity';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { FileUploadService } from '../file-upload/file-upload.service';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@ApiTags('employees')
@Controller('employees')
export class EmployeeController {
	constructor(
		private readonly employeeService: EmployeeService,
		private readonly fileUploadService: FileUploadService,
	) {}

	@Get()
	@ApiOkResponse({ type: EmployeeContact, isArray: true })
	findAll() {
		return this.employeeService.findAll();
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor('photo'))
	@ApiBearerAuth()
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Создание сотрудника с загрузкой фото',
		schema: {
			type: 'object',
			properties: {
				fullName: { type: 'string', example: 'Татьяна Черняева', description: 'ФИО сотрудника' },
				position: { type: 'string', example: 'Председатель', description: 'Должность' },
				email: { type: 'string', example: 'tatiana.rosrest@gmail.com', description: 'Email' },
				phone: { type: 'string', example: '+7 (495) 123-45-67', description: 'Телефон' },
				photo: { type: 'string', format: 'binary', description: 'Фото сотрудника (файл)' },
				photoUrl: {
					type: 'string',
					example: 'https://rosrest.com/uploads/images/employee-photo.jpg',
					description: 'Ссылка на фото сотрудника, если фото не загружается файлом',
				},
				profileUrl: { type: 'string', example: 'https://rosrest.com/member/tatiana', description: 'Ссылка на профиль' },
				orderIndex: { type: 'number', example: 0, description: 'Порядок сортировки' },
			},
			required: ['fullName', 'position', 'orderIndex'],
		},
	})
	@ApiCreatedResponse({ type: EmployeeContact, description: 'Employee created' })
	@ApiResponse({ status: 400, description: 'Bad request - validation failed' })
	create(
		@Body() dto: CreateEmployeeDto,
		@Body('photoUrl') rawPhotoUrl: string,
		@UploadedFile() file?: UploadFile,
	) {
		if (!dto.photoUrl && rawPhotoUrl) {
			dto.photoUrl = rawPhotoUrl;
		}
		return this.employeeService.create(dto, file, this.fileUploadService);
	}

	@Get(':id')
	@ApiOkResponse({ type: EmployeeContact, description: 'Employee found' })
	@ApiResponse({ status: 404, description: 'Employee with ID not found' })
	findOne(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.employeeService.findOne(id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor('photo'))
	@ApiBearerAuth()
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Обновление сотрудника с опциональной загрузкой нового фото',
		schema: {
			type: 'object',
			properties: {
				fullName: { type: 'string', example: 'Татьяна Черняева', description: 'ФИО сотрудника' },
				position: { type: 'string', example: 'Председатель', description: 'Должность' },
				email: { type: 'string', example: 'tatiana.rosrest@gmail.com', description: 'Email' },
				phone: { type: 'string', example: '+7 (495) 123-45-67', description: 'Телефон' },
				photo: { type: 'string', format: 'binary', description: 'Новое фото сотрудника (файл, опционально)' },
				photoUrl: {
					type: 'string',
					example: 'https://rosrest.com/uploads/images/employee-photo-new.jpg',
					description: 'Новая ссылка на фото сотрудника (опционально)',
				},
				profileUrl: { type: 'string', example: 'https://rosrest.com/member/tatiana', description: 'Ссылка на профиль' },
				orderIndex: { type: 'number', example: 0, description: 'Порядок сортировки' },
			},
		},
	})
	@ApiOkResponse({ type: EmployeeContact, description: 'Employee updated' })
	@ApiResponse({ status: 400, description: 'Bad request - validation failed' })
	@ApiResponse({ status: 404, description: 'Employee with ID not found' })
	update(
		@Param('id', new ParseUUIDPipe()) id: string,
		@Body() dto: UpdateEmployeeDto,
		@UploadedFile() file?: UploadFile,
	) {
		return this.employeeService.update(id, dto, file, this.fileUploadService);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(204)
	@ApiResponse({ status: 204, description: 'Employee deleted successfully' })
	@ApiResponse({ status: 404, description: 'Employee with ID not found' })
	remove(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.employeeService.remove(id);
	}
}




