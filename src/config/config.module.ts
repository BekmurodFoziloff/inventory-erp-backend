import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from '@hapi/joi';
import { ScheduleModule } from '@nestjs/schedule';
import { IsUniqueConstraint } from '@common/decorators/is-unique.decorator';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: Joi.object({
        MONGO_URI: Joi.string().required(),
        PORT: Joi.number()
      })
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI')
      })
    }),
    ScheduleModule.forRoot()
  ],
  providers: [IsUniqueConstraint]
})
export class AppConfigModule {}
