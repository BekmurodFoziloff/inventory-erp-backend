import { ClassSerializerInterceptor, PlainLiteralObject, Type } from '@nestjs/common';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import { Document } from 'mongoose';

function MongooseClassSerializerInterceptor(classToIntercept: Type): typeof ClassSerializerInterceptor {
  return class Interceptor extends ClassSerializerInterceptor {
    private convertToPlain(data: any): any {
      if (!data) return data;
      if (Array.isArray(data)) return data.map((item) => this.convertToPlain(item));
      if (data instanceof Document) return data.toJSON();

      if (typeof data === 'object' && data.constructor === Object) {
        const plain: any = {};
        for (const key of Object.keys(data)) {
          plain[key] = this.convertToPlain(data[key]);
        }
        return plain;
      }
      return data;
    }

    serialize(response: PlainLiteralObject | PlainLiteralObject[], options: ClassTransformOptions) {
      const plainResponse = this.convertToPlain(response);

      // System default options + Our custom needs
      const defaultOptions: ClassTransformOptions = {
        ...options,
        excludeExtraneousValues: options.excludeExtraneousValues ?? true,
        enableImplicitConversion: true
      };

      if (!plainResponse || typeof plainResponse !== 'object') {
        return plainResponse;
      }

      if (plainResponse.data && Array.isArray(plainResponse.data)) {
        return {
          ...plainResponse,
          data: plainToInstance(classToIntercept, plainResponse.data, defaultOptions)
        };
      }

      if (Array.isArray(plainResponse) || plainResponse.id || plainResponse._id) {
        return plainToInstance(classToIntercept, plainResponse, defaultOptions);
      }

      return plainResponse;
    }
  };
}

export default MongooseClassSerializerInterceptor;
