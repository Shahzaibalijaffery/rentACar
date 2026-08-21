import { Injectable, Logger } from '@nestjs/common';
import type { HandoverEventPayload, HandoverEventType } from './handover-events.types';

@Injectable()
export class HandoverEventsService {
  private readonly logger = new Logger(HandoverEventsService.name);

  emit(event: HandoverEventType, payload: HandoverEventPayload): void {
    this.logger.debug(`Handover event: ${event} handoverId=${payload.handoverId}`);
  }
}
