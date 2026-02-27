import { ClassSerializerInterceptor, PlainLiteralObject, Type } from '@nestjs/common';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import { Document, Types } from 'mongoose';

function MongooseClassSerializerInterceptor(classToIntercept: Type): typeof ClassSerializerInterceptor {
  return class Interceptor extends ClassSerializerInterceptor {
    private convertToPlain(data: any): any {
      if (!data) return data;

      if (data instanceof Types.ObjectId) return data.toString();

      if (data instanceof Date) return data.toISOString();

      if (Array.isArray(data)) return data.map((item) => this.convertToPlain(item));

      if (data instanceof Document) {
        return this.convertToPlain(data.toJSON());
      }

      if (typeof data === 'object' && data.constructor === Object) {
        const plain: any = {};
        for (const key of Object.keys(data)) {
          plain[key] = this.convertToPlain(data[key]);
        }

        if (plain._id && !plain.id) {
          plain.id = plain._id.toString();
        }

        return plain;
      }

      return data;
    }

    serialize(response: PlainLiteralObject | PlainLiteralObject[], options: ClassTransformOptions) {
      const plainResponse = this.convertToPlain(response);

      return super.serialize(
        plainToInstance(classToIntercept, plainResponse, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true
        }),
        {
          ...options,
          strategy: 'excludeAll'
        }
      );
    }
  };
}

export default MongooseClassSerializerInterceptor;
