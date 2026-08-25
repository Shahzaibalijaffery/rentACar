import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevicePlatform } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type { NotificationType } from '@rentacar/shared';
import type { AppConfig } from '../../config/env.config';
import { getPushCopy } from './notification-copy';
import { NotificationsRepository } from './notifications.repository';

type FirebaseMessaging = {
  sendEachForMulticast: (payload: {
    tokens: string[];
    notification: { title: string; body: string };
    data: Record<string, string>;
    android: { priority: 'high' };
  }) => Promise<{
    responses: Array<{ success: boolean; error?: { code?: string } }>;
  }>;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private messaging: FirebaseMessaging | null = null;

  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly notificationsRepository: NotificationsRepository,
  ) {
    this.messaging = this.initFirebase();
  }

  isEnabled(): boolean {
    return this.messaging !== null;
  }

  async sendToUser(
    userId: string,
    input: {
      type: NotificationType;
      rentalId?: string;
      agreementId?: string;
      handoverId?: string;
      notificationId?: string;
    },
  ): Promise<void> {
    if (!this.messaging) {
      return;
    }

    const devices = await this.notificationsRepository.listDeviceTokens(userId);
    const androidDevices = devices.filter((device) => device.platform === DevicePlatform.ANDROID);
    if (androidDevices.length === 0) {
      return;
    }

    const grouped = new Map<string, string[]>();
    for (const device of androidDevices) {
      const locale = device.locale || 'en';
      const tokens = grouped.get(locale) ?? [];
      tokens.push(device.token);
      grouped.set(locale, tokens);
    }

    for (const [locale, tokens] of grouped) {
      const copy = getPushCopy(input.type, locale);
      try {
        const result = await this.messaging.sendEachForMulticast({
          tokens,
          notification: { title: copy.title, body: copy.body },
          data: {
            type: input.type,
            rentalId: input.rentalId ?? '',
            agreementId: input.agreementId ?? '',
            handoverId: input.handoverId ?? '',
            notificationId: input.notificationId ?? '',
          },
          android: { priority: 'high' },
        });

        await this.dropInvalidTokens(tokens, result.responses);
      } catch (error) {
        this.logger.warn(
          `FCM send failed for user ${userId}: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }
  }

  private async dropInvalidTokens(
    tokens: string[],
    responses: Array<{ success: boolean; error?: { code?: string } }>,
  ): Promise<void> {
    const staleCodes = new Set([
      'messaging/registration-token-not-registered',
      'messaging/invalid-registration-token',
    ]);

    await Promise.all(
      responses.map(async (response, index) => {
        const token = tokens[index];
        const code = response.error?.code;
        if (!response.success && token && code && staleCodes.has(code)) {
          await this.notificationsRepository.deleteDeviceTokenByValue(token);
        }
      }),
    );
  }

  private initFirebase(): FirebaseMessaging | null {
    const raw = this.readServiceAccountJson();
    if (!raw) {
      this.logger.log('FCM disabled — no Firebase service account configured');
      return null;
    }

    try {
      // Lazy require so unit tests do not need the native firebase package graph.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const adminApp = require('firebase-admin/app') as {
        getApps: () => unknown[];
        initializeApp: (options: { credential: unknown }) => void;
        cert: (value: object) => unknown;
      };
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const adminMessaging = require('firebase-admin/messaging') as {
        getMessaging: () => FirebaseMessaging;
      };

      if (adminApp.getApps().length === 0) {
        adminApp.initializeApp({ credential: adminApp.cert(JSON.parse(raw) as object) });
      }

      this.logger.log('FCM enabled for Android push');
      return adminMessaging.getMessaging();
    } catch (error) {
      this.logger.warn(
        `FCM init failed: ${error instanceof Error ? error.message : 'invalid service account JSON'}`,
      );
      return null;
    }
  }

  private readServiceAccountJson(): string | undefined {
    const inline = this.configService.get('firebaseServiceAccountJson', { infer: true });
    if (inline) {
      return inline;
    }

    const relativePath = this.configService.get('firebaseServiceAccountPath', { infer: true });
    if (!relativePath) {
      return undefined;
    }

    const filePath = isAbsolute(relativePath) ? relativePath : resolve(process.cwd(), relativePath);
    try {
      return readFileSync(filePath, 'utf8');
    } catch {
      this.logger.warn('FCM disabled — Firebase service account file was not found');
      return undefined;
    }
  }
}
