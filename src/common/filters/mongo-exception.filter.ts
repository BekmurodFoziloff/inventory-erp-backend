import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, HttpException } from '@nestjs/common';
import { Response } from 'express';
import MongoErrorCode from '@common/enums/mongo-error-codes.enum';

@Catch()
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === MongoErrorCode.DublicateKey) {
      const field = exception.keyPattern ? Object.keys(exception.keyPattern)[0] : 'field';

      const value = exception.keyValue ? exception.keyValue[field] : '';

      const friendlyField = field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      return response.status(HttpStatus.BAD_REQUEST).json({
        errors: {
          [field]: `${friendlyField} "${value}" is already in use. Please provide a unique ${friendlyField.toLowerCase()}.`
        },
        error: 'Bad Request',
        statusCode: 400
      });
    }

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json(exception.getResponse());
    }

    console.error('CRITICAL DATABASE ERROR:', exception);

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'An unexpected database error occurred. Please contact support.',
      statusCode: 500
    });
  }
}
