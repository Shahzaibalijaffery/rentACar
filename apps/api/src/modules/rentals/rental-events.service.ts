import { Injectable, Logger } from '@nestjs/common';
import type { RentalEventPayload, RentalEventType } from './rental-events.types';

/**
 * Decoupled hook for future notification delivery.
 * Rental business logic emits events here without coupling to push/email providers.
 */
@Injectable()
export class RentalEventsService {
  private readonly logger = new Logger(RentalEventsService.name);

  emit(event: RentalEventType, payload: RentalEventPayload): void {
    this.logger.debug(`Rental event: ${event} rentalId=${payload.rentalId}`);
  }
}
