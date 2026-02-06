import { IsOptional, IsInt, Min, Max, IsIn, IsString, IsBoolean } from 'class-validator';
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

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  comparePreviousPeriod?: boolean;
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
  @Max(100)
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

export class UserTimeRangeDto extends TimeRangeDto {
  @IsOptional()
  @IsString()
  userId?: string;
}
