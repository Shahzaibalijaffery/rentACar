import { Injectable, Logger } from '@nestjs/common';
import type { AgreementEventPayload, AgreementEventType } from './agreement-events.types';

@Injectable()
export class AgreementEventsService {
  private readonly logger = new Logger(AgreementEventsService.name);

  emit(event: AgreementEventType, payload: AgreementEventPayload): void {
    this.logger.debug(`Agreement event: ${event} agreementId=${payload.agreementId}`);
  }
}
