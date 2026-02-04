import { Controller, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersQueryDto, UserDetailQueryDto } from './dto/users-query.dto';
import { DailyStatsQueryDto } from './dto/daily-stats-query.dto';
import type {
  UsersResponse,
  UserDetail,
  UserDailyStatsResponse,
} from '@claude-code-monitor/shared';

@Controller('api/users')
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

  @Get(':userId/daily-stats')
  getUserDailyStats(
    @Param('userId') userId: string,
    @Query() query: DailyStatsQueryDto,
  ): UserDailyStatsResponse {
    return this.usersService.getUserDailyStats(userId, query);
  }
}
