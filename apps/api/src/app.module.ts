import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { OtlpModule } from './otlp/otlp.module';
import { MetricsModule } from './metrics/metrics.module';
import { AggregationModule } from './aggregation/aggregation.module';
import { LogsModule } from './logs/logs.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    OtlpModule,
    MetricsModule,
    AggregationModule,
    LogsModule,
    UsersModule,
  ],
})
export class AppModule {}
