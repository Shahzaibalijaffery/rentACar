import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { AppConfig } from '../../config/env.config';
import { EmailService, SendEmailInput } from './email.service';

@Injectable()
export class SmtpEmailService extends EmailService implements OnModuleInit {
  private readonly logger = new Logger(SmtpEmailService.name);
  private readonly transporter: Transporter;
  private readonly fromAddress: string;
  private readonly smtpHost: string | undefined;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    super();
    this.smtpHost = this.configService.get('smtpHost', { infer: true });
    const port = this.configService.get('smtpPort', { infer: true });
    const user = this.configService.get('smtpUser', { infer: true });
    const pass = this.configService.get('smtpPass', { infer: true });
    const configuredFrom = this.configService.get('emailFrom', { infer: true });
    this.fromAddress = user ? `"RentACar" <${user}>` : configuredFrom;

    this.transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    if (!this.smtpHost) {
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log(`Nodemailer SMTP ready (${this.smtpHost}) from=${this.fromAddress}`);
    } catch (error) {
      this.logger.error(
        `Nodemailer SMTP verify failed for ${this.smtpHost}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  async sendEmail(input: SendEmailInput): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      this.logger.log(`Email sent to ${input.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${input.to}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw error;
    }
  }
}
