import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { AppConfig } from '../../config/env.config';
import { EmailService, SendEmailInput } from './email.service';

@Injectable()
export class SmtpEmailService extends EmailService {
  private readonly logger = new Logger(SmtpEmailService.name);
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    super();
    const host = this.configService.get('smtpHost', { infer: true });
    const port = this.configService.get('smtpPort', { infer: true });
    const user = this.configService.get('smtpUser', { infer: true });
    const pass = this.configService.get('smtpPass', { infer: true });
    this.fromAddress = this.configService.get('emailFrom', { infer: true });

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendEmail(input: SendEmailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    this.logger.log(`Email sent to ${input.to}`);
  }
}
