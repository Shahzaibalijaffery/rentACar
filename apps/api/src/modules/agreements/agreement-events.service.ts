import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import type { AgreementEventPayload, AgreementEventType } from './agreement-events.types';

@Injectable()
export class AgreementEventsService {
  private readonly logger = new Logger(AgreementEventsService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  emit(event: AgreementEventType, payload: AgreementEventPayload): void {
    this.logger.debug(`Agreement event: ${event} agreementId=${payload.agreementId}`);
    void this.notificationsService
      .handleAgreementEvent(event, payload)
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to dispatch ${event} for agreement ${payload.agreementId}`,
          error instanceof Error ? error.stack : undefined,
        );
      });
  }
}
