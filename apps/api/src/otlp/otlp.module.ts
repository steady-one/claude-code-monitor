import { Module } from '@nestjs/common';
import { OtlpController } from './otlp.controller';
import { OtlpService } from './otlp.service';
import { AuthGuard } from './guards/auth.guard';

@Module({
  controllers: [OtlpController],
  providers: [OtlpService, AuthGuard],
  exports: [OtlpService],
})
export class OtlpModule {}
