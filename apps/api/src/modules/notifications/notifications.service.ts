import { Injectable, Logger } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';
import type {
  NotificationType,
  NotificationUnreadCount,
  NotificationView,
  PaginatedResponse,
  RealtimeEvent,
  RegisterDeviceTokenRequest,
} from '@rentacar/shared';
import type { AgreementEventPayload, AgreementEventType } from '../agreements/agreement-events.types';
import type { HandoverEventPayload, HandoverEventType } from '../handovers/handover-events.types';
import type { RentalEventPayload, RentalEventType } from '../rentals/rental-events.types';
import {
  planAgreementNotification,
  planHandoverNotification,
  planRentalNotification,
  type NotificationDispatch,
} from './notification-policy';
import { NotificationsRepository, type NotificationRecord } from './notifications.repository';
import { PushService } from './push.service';
import { RealtimeService } from './realtime.service';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly realtimeService: RealtimeService,
    private readonly pushService: PushService,
  ) {}

  async handleRentalEvent(event: RentalEventType, payload: RentalEventPayload): Promise<void> {
    await this.dispatch(planRentalNotification(event, payload));
  }

  async handleAgreementEvent(
    event: AgreementEventType,
    payload: AgreementEventPayload,
  ): Promise<void> {
    await this.dispatch(planAgreementNotification(event, payload));
  }

  async handleHandoverEvent(event: HandoverEventType, payload: HandoverEventPayload): Promise<void> {
    await this.dispatch(planHandoverNotification(event, payload));
  }

  async list(
    userId: string,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResponse<NotificationView>> {
    const take = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
    const currentPage = Math.max(page, 1);
    const skip = (currentPage - 1) * take;
    const [records, total] = await Promise.all([
      this.notificationsRepository.listForUser(userId, skip, take),
      this.notificationsRepository.countForUser(userId),
    ]);

    return {
      data: records.map(toNotificationView),
      meta: { page: currentPage, pageSize: take, total },
    };
  }

  async unreadCount(userId: string): Promise<{ data: NotificationUnreadCount }> {
    const count = await this.notificationsRepository.countUnread(userId);
    return { data: { count } };
  }

  async markRead(userId: string, id: string): Promise<{ data: { ok: true } }> {
    await this.notificationsRepository.markRead(id, userId);
    return { data: { ok: true } };
  }

  async markAllRead(userId: string): Promise<{ data: { ok: true } }> {
    await this.notificationsRepository.markAllRead(userId);
    return { data: { ok: true } };
  }

  async registerDevice(
    userId: string,
    dto: RegisterDeviceTokenRequest,
  ): Promise<{ data: { ok: true } }> {
    await this.notificationsRepository.upsertDeviceToken({
      userId,
      token: dto.token,
      platform: DevicePlatform.ANDROID,
      locale: dto.locale === 'ur' ? 'ur' : 'en',
    });
    this.logger.log(`Registered Android device token for user ${userId}`);
    return { data: { ok: true } };
  }

  async unregisterDevice(userId: string, token: string): Promise<{ data: { ok: true } }> {
    await this.notificationsRepository.deleteDeviceToken(userId, token);
    return { data: { ok: true } };
  }

  private async dispatch(plan: NotificationDispatch): Promise<void> {
    if (plan.recipientIds.length === 0) {
      return;
    }

    await Promise.all(
      plan.recipientIds.map(async (userId) => {
        try {
          let notification: NotificationView | undefined;
          if (plan.persistType) {
            const record = await this.notificationsRepository.create({
              userId,
              type: plan.persistType,
              ...optionalIds(plan),
            });
            notification = toNotificationView(record);
          }

          const event: RealtimeEvent = {
            type: plan.realtimeType,
            ...optionalIds(plan),
            ...(notification ? { notification } : {}),
          };

          const connected = this.realtimeService.isConnected(userId);
          this.realtimeService.emitToUser(userId, 'notification', event);

          if (plan.persistType) {
            this.logger.log(
              `Notify ${userId} type=${plan.persistType} rental=${plan.rentalId ?? '-'} connected=${connected}`,
            );
            await this.pushService.sendToUser(userId, {
              type: plan.persistType,
              ...optionalIds(plan),
              ...(notification ? { notificationId: notification.id } : {}),
            });
          }
        } catch (error) {
          this.logger.error(
            `Notification side effect failed user=${userId} type=${plan.persistType ?? plan.realtimeType}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }),
    );
  }
}

function optionalIds(source: {
  rentalId?: string;
  agreementId?: string;
  handoverId?: string;
}): { rentalId?: string; agreementId?: string; handoverId?: string } {
  const ids: { rentalId?: string; agreementId?: string; handoverId?: string } = {};
  if (source.rentalId) {
    ids.rentalId = source.rentalId;
  }
  if (source.agreementId) {
    ids.agreementId = source.agreementId;
  }
  if (source.handoverId) {
    ids.handoverId = source.handoverId;
  }
  return ids;
}

function toNotificationView(record: NotificationRecord): NotificationView {
  return {
    id: record.id,
    type: record.type as NotificationType,
    rentalId: record.rentalId,
    agreementId: record.agreementId,
    handoverId: record.handoverId,
    readAt: record.readAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
  };
}
