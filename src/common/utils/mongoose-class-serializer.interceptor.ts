import { ClassSerializerInterceptor, PlainLiteralObject, Type } from '@nestjs/common';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import { Document } from 'mongoose';

function MongooseClassSerializerInterceptor(classToIntercept: Type): typeof ClassSerializerInterceptor {
  return class Interceptor extends ClassSerializerInterceptor {
    private changePlainObjectToClass(document: PlainLiteralObject) {
      if (!document) return document;

      const plainObj = document instanceof Document ? document.toJSON() : document;

      return plainToInstance(classToIntercept, plainObj, {
        excludeExtraneousValues: true
      });
    }

    private prepareResponse(response: PlainLiteralObject | PlainLiteralObject[]) {
      if (!response) return response;

      if (Array.isArray(response)) {
        return response.map((item) => this.changePlainObjectToClass(item));
      }

      if (typeof response === 'object' && !(response instanceof Document)) {
        for (const key in response) {
          if (response[key] && typeof response[key] === 'object') {
            response[key] = this.changePlainObjectToClass(response[key]);
          }
        }
      }

      return this.changePlainObjectToClass(response);
    }

    serialize(response: PlainLiteralObject | PlainLiteralObject[], options: ClassTransformOptions) {
      return super.serialize(this.prepareResponse(response), {
        ...options,
        strategy: 'excludeAll'
      });
    }
  };
}

export default MongooseClassSerializerInterceptor;
