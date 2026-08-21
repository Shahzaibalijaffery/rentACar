import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/env.config';
import { ConsoleEmailService } from './console-email.service';
import { EmailService } from './email.service';
import { SmtpEmailService } from './smtp-email.service';

@Global()
@Module({
  providers: [
    ConsoleEmailService,
    SmtpEmailService,
    {
      provide: EmailService,
      inject: [ConfigService, ConsoleEmailService, SmtpEmailService],
      useFactory: (
        configService: ConfigService<AppConfig, true>,
        consoleEmailService: ConsoleEmailService,
        smtpEmailService: SmtpEmailService,
      ) => {
        const smtpHost = configService.get('smtpHost', { infer: true });
        return smtpHost ? smtpEmailService : consoleEmailService;
      },
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
