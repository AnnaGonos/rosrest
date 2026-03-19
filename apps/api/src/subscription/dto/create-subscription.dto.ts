import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Email адрес для подписки',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Введите корректный email адрес' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Имя подписчика',
    example: 'Анна',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}
