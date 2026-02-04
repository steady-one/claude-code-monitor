import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { OtlpService } from './otlp.service';
import { AuthGuard } from './guards/auth.guard';
import type {
  ExportMetricsServiceRequest,
  RequestMetadata,
} from '@claude-code-monitor/shared';

@Controller('v1')
@UseGuards(AuthGuard)
export class OtlpController {
  constructor(private readonly otlpService: OtlpService) {}

  @Post('metrics')
  @HttpCode(HttpStatus.OK)
  async receiveMetrics(
    @Body() body: ExportMetricsServiceRequest,
    @Req() req: Request,
  ): Promise<{ partialSuccess?: { rejectedDataPoints?: number } }> {
    const metadata: RequestMetadata = {
      endpoint: req.url,
      method: req.method,
      clientIp: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      requestSize: parseInt(req.headers['content-length'] ?? '0', 10),
    };

    const result = await this.otlpService.processMetrics(body, metadata);
    return result;
  }

  private getClientIp(request: Request): string | undefined {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }
    if (Array.isArray(xForwardedFor)) {
      return xForwardedFor[0];
    }
    return request.ip;
  }
}
