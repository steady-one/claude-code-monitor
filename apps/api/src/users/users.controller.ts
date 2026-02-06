import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../otlp/guards/auth.guard';
import { UsersQueryDto, UserDetailQueryDto } from './dto/users-query.dto';
import { UserSessionsQueryDto } from './dto/user-sessions-query.dto';
import { DailyStatsQueryDto } from './dto/daily-stats-query.dto';
import type {
  UsersResponse,
  UserDetail,
  UserDailyStatsResponse,
  UserSessionsResponse,
} from '@claude-code-monitor/shared';

@Controller('api/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@Query() query: UsersQueryDto): UsersResponse {
    return this.usersService.getUsers(query);
  }

  @Get(':userId')
  getUserDetail(
    @Param('userId') userId: string,
    @Query() query: UserDetailQueryDto,
  ): UserDetail {
    return this.usersService.getUserDetail(userId, query);
  }

  @Get(':userId/sessions')
  getUserSessions(
    @Param('userId') userId: string,
    @Query() query: UserSessionsQueryDto,
  ): UserSessionsResponse {
    return this.usersService.getUserSessions(userId, query);
  }

  @Get(':userId/daily-stats')
  getUserDailyStats(
    @Param('userId') userId: string,
    @Query() query: DailyStatsQueryDto,
  ): UserDailyStatsResponse {
    return this.usersService.getUserDailyStats(userId, query);
  }
}
