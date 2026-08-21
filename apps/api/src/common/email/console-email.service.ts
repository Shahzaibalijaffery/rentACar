import { Injectable, Logger } from '@nestjs/common';
import { EmailService, SendEmailInput } from './email.service';

@Injectable()
export class ConsoleEmailService extends EmailService {
  private readonly logger = new Logger(ConsoleEmailService.name);

  sendEmail(input: SendEmailInput): Promise<void> {
    this.logger.log(`Email queued to ${input.to} — subject: ${input.subject}`);
    return Promise.resolve();
  }
}
