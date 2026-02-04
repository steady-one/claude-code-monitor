import { IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class DailyStatsQueryDto {
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
  @IsIn(['day', 'month'])
  groupBy?: 'day' | 'month';
}
