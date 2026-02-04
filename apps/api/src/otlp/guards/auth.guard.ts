import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const startTime = Date.now();

    const logAuthFailure = (errorMessage: string): void => {
      const processingTime = Date.now() - startTime;
      this.databaseService.insertRequestLog({
        endpoint: request.url,
        method: request.method,
        clientIp: this.getClientIp(request),
        userAgent: request.headers['user-agent'],
        requestSize: parseInt(request.headers['content-length'] ?? '0', 10),
        dataPointsReceived: 0,
        dataPointsProcessed: 0,
        dataPointsRejected: 0,
        processingTimeMs: processingTime,
        status: 'auth_failed',
        errorMessage,
        timestamp: startTime,
      });
    };

    if (!authHeader) {
      logAuthFailure('Authorization header is required');
      throw new UnauthorizedException('Authorization header is required');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      logAuthFailure('Invalid authorization format');
      throw new UnauthorizedException('Invalid authorization format');
    }

    const expectedToken = this.configService.get<string>('AUTH_TOKEN');

    if (!expectedToken) {
      logAuthFailure('Server AUTH_TOKEN not configured');
      throw new UnauthorizedException('Server AUTH_TOKEN not configured');
    }

    if (token !== expectedToken) {
      logAuthFailure('Invalid token');
      throw new UnauthorizedException('Invalid token');
    }

    return true;
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
