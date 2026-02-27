import { PartialType } from '@nestjs/mapped-types';
import { CreateRarMemberDto } from './create-rar-member.dto';

export class UpdateRarMemberDto extends PartialType(CreateRarMemberDto) { }
