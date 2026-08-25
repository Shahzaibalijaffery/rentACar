import { Injectable } from '@nestjs/common';
import { DevicePlatform, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import type { NotificationType as SharedNotificationType } from '@rentacar/shared';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: {
    userId: string;
    type: SharedNotificationType;
    rentalId?: string;
    agreementId?: string;
    handoverId?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        rentalId: input.rentalId ?? null,
        agreementId: input.agreementId ?? null,
        handoverId: input.handoverId ?? null,
      },
    });
  }

  listForUser(userId: string, skip: number, take: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  countForUser(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId } });
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  findOwned(id: string, userId: string) {
    return this.prisma.notification.findFirst({ where: { id, userId } });
  }

  markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  upsertDeviceToken(input: {
    userId: string;
    token: string;
    platform: DevicePlatform;
    locale: string;
  }) {
    return this.prisma.deviceToken.upsert({
      where: { token: input.token },
      create: input,
      update: {
        userId: input.userId,
        platform: input.platform,
        locale: input.locale,
      },
    });
  }

  deleteDeviceToken(userId: string, token: string) {
    return this.prisma.deviceToken.deleteMany({ where: { userId, token } });
  }

  listDeviceTokens(userId: string) {
    return this.prisma.deviceToken.findMany({ where: { userId } });
  }

  deleteDeviceTokenByValue(token: string) {
    return this.prisma.deviceToken.deleteMany({ where: { token } });
  }
}

export type NotificationRecord = Prisma.NotificationGetPayload<object>;
