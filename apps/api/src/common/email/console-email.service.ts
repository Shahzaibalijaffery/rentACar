import { Injectable, Logger } from '@nestjs/common';
import { EmailService, SendEmailInput } from './email.service';

@Injectable()
export class ConsoleEmailService extends EmailService {
  private readonly logger = new Logger(ConsoleEmailService.name);

  sendEmail(input: SendEmailInput): Promise<void> {
    this.logger.log(
      `RESEND_API_KEY unset — logging email instead of sending via Resend\nto=${input.to}\nsubject=${input.subject}\n${input.text}`,
    );
    return Promise.resolve();
  }
}
