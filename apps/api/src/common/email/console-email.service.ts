import { Injectable, Logger } from '@nestjs/common';
import { EmailService, SendEmailInput } from './email.service';

@Injectable()
export class ConsoleEmailService extends EmailService {
  private readonly logger = new Logger(ConsoleEmailService.name);

  sendEmail(input: SendEmailInput): Promise<void> {
    this.logger.log(
      `SMTP_HOST unset — logging email instead of sending via Nodemailer\nto=${input.to}\nsubject=${input.subject}\n${input.text}`,
    );
    return Promise.resolve();
  }
}
