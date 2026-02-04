import { IsOptional, IsInt, Min, IsIn, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class TimeRangeDto {
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
  @IsIn(['hour', 'day'])
  interval?: 'hour' | 'day';
}

export class PaginatedTimeRangeDto extends TimeRangeDto {
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 20))
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export class DetailedTokensQueryDto extends TimeRangeDto {
  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
