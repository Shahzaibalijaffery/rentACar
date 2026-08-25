import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import type {
  NotificationUnreadCount,
  NotificationView,
  PaginatedResponse,
  RegisterDeviceTokenRequest,
} from '@rentacar/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RegisterDeviceTokenDto, UnregisterDeviceTokenDto } from './dto/device-token.dto';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<PaginatedResponse<NotificationView>> {
    return this.notificationsService.list(user.userId, query.page, query.pageSize);
  }

  @Get('unread-count')
  unreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: NotificationUnreadCount }> {
    return this.notificationsService.unreadCount(user.userId);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<{ data: { ok: true } }> {
    return this.notificationsService.markAllRead(user.userId);
  }

  @Post(':id/read')
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ data: { ok: true } }> {
    return this.notificationsService.markRead(user.userId, id);
  }

  @Post('device-token')
  registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<{ data: { ok: true } }> {
    return this.notificationsService.registerDevice(user.userId, dto as RegisterDeviceTokenRequest);
  }

  @Delete('device-token')
  unregisterDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnregisterDeviceTokenDto,
  ): Promise<{ data: { ok: true } }> {
    return this.notificationsService.unregisterDevice(user.userId, dto.token);
  }
}
