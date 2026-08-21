import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import envConfig, { envValidationSchema } from './env.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
  ],
})
export class AppConfigModule {}
