import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import type { HandoverEventPayload, HandoverEventType } from './handover-events.types';

@Injectable()
export class HandoverEventsService {
  private readonly logger = new Logger(HandoverEventsService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  emit(event: HandoverEventType, payload: HandoverEventPayload): void {
    this.logger.debug(`Handover event: ${event} handoverId=${payload.handoverId}`);
    void this.notificationsService.handleHandoverEvent(event, payload).catch((error: unknown) => {
      this.logger.error(
        `Failed to dispatch ${event} for handover ${payload.handoverId}`,
        error instanceof Error ? error.stack : undefined,
      );
    });
  }
}
