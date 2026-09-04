import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { AppConfig } from '../../config/env.config';
import { EmailService, SendEmailInput } from './email.service';

@Injectable()
export class ResendEmailService extends EmailService {
  private readonly logger = new Logger(ResendEmailService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    super();
    const apiKey = this.configService.get('resendApiKey', { infer: true });
    const fromEmail = this.configService.get('emailFrom', { infer: true });
    const fromName = this.configService.get('emailFromName', { infer: true });
    this.fromAddress = `${fromName} <${fromEmail}>`;
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendEmail(input: SendEmailInput): Promise<void> {
    if (!this.resend) {
      throw new Error('Resend API key is not configured');
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`Email sent to ${input.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${input.to}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw error;
    }
  }
}
