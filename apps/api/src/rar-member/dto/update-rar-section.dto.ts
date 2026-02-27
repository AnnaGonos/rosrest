import { PartialType } from '@nestjs/mapped-types';
import { CreateRarSectionDto } from './create-rar-section.dto';

export class UpdateRarSectionDto extends PartialType(CreateRarSectionDto) { }
