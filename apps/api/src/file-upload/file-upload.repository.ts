import { EntityRepository, Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';

@EntityRepository(FileEntity)
export class FileUploadRepository extends Repository<FileEntity> {}
