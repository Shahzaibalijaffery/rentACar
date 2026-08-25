import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import type { RentalEventPayload, RentalEventType } from './rental-events.types';

@Injectable()
export class RentalEventsService {
  private readonly logger = new Logger(RentalEventsService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  emit(event: RentalEventType, payload: RentalEventPayload): void {
    this.logger.log(`Rental event: ${event} rentalId=${payload.rentalId}`);
    void this.notificationsService.handleRentalEvent(event, payload).catch((error: unknown) => {
      this.logger.error(
        `Failed to dispatch ${event} for rental ${payload.rentalId}`,
        error instanceof Error ? error.stack : undefined,
      );
    });
  }
}
