import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, ValidationError, BadRequestException } from '@nestjs/common';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ExcludeNullInterceptor } from '@common/utils/exclude-null.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: true,
    credentials: true
  });

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formatError = (errors: ValidationError[]) => {
          const errMsg = {};
          errors.forEach((err) => {
            errMsg[err.property] = Object.values(err.constraints)[0];
          });
          return errMsg;
        };
        return new BadRequestException({
          errors: formatError(errors),
          error: 'Bad Request',
          statusCode: 400
        });
      }
    })
  );

  app.useGlobalInterceptors(new ExcludeNullInterceptor());

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') ?? 3000;
  await app.listen(port);
}
bootstrap();
