import { ClassSerializerInterceptor, PlainLiteralObject, Type, ExecutionContext, Injectable } from '@nestjs/common';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import { Document } from 'mongoose';
import { Reflector } from '@nestjs/core';
import { SERIALIZE_TO_KEY } from '@common/decorators/serialize-to.decorator';

function MongooseClassSerializerInterceptor(defaultClass: Type): typeof ClassSerializerInterceptor {
  @Injectable()
  class Interceptor extends ClassSerializerInterceptor {
    constructor(protected readonly reflector: Reflector) {
      super(reflector);
    }

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
      const context = (this as any).getContext();
      const handler = context.getHandler();
      const targetClass = this.reflector.get(SERIALIZE_TO_KEY, handler) || defaultClass;

      const plainResponse = this.convertToPlain(response);

      if (!plainResponse || typeof plainResponse !== 'object') {
        return plainResponse;
      }

      const defaultOptions: ClassTransformOptions = {
        ...options,
        excludeExtraneousValues: true,
        enableImplicitConversion: true
      };

      const isPagination = !!(plainResponse.data && Array.isArray(plainResponse.data));
      const isArray = Array.isArray(plainResponse);
      const isSingleModel = !!(plainResponse.id || plainResponse._id);

      if (!isPagination && !isArray && !isSingleModel) {
        return plainResponse;
      }

      if (isPagination) {
        return {
          ...plainResponse,
          data: plainToInstance(targetClass, plainResponse.data, defaultOptions)
        };
      }

      return plainToInstance(targetClass, plainResponse, defaultOptions);
    }

    intercept(context: ExecutionContext, next: any) {
      (this as any).getContext = () => context;
      return super.intercept(context, next);
    }
  }

  return Interceptor;
}

export default MongooseClassSerializerInterceptor;
