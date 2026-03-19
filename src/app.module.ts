import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AuthenticationModule } from '@modules/authentication/authentication.module';

@Module({
  imports: [AppConfigModule, AuthenticationModule]
})
export class AppModule {}
