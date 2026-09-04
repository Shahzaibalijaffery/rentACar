import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/env.config';
import { ConsoleEmailService } from './console-email.service';
import { EmailService } from './email.service';
import { ResendEmailService } from './resend-email.service';

@Global()
@Module({
  providers: [
    ConsoleEmailService,
    ResendEmailService,
    {
      provide: EmailService,
      inject: [ConfigService, ConsoleEmailService, ResendEmailService],
      useFactory: (
        configService: ConfigService<AppConfig, true>,
        consoleEmailService: ConsoleEmailService,
        resendEmailService: ResendEmailService,
      ) => {
        const resendApiKey = configService.get('resendApiKey', { infer: true });
        return resendApiKey ? resendEmailService : consoleEmailService;
      },
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
