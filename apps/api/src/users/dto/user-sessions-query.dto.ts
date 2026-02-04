import { IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UserSessionsQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(0)
  from?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(0)
  to?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  @IsInt()
  @Min(1)
  pageSize?: number;
}
