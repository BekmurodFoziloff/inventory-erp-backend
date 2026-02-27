import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

function SerializeDate() {
  return applyDecorators(
    Transform(({ value }) => {
      if (!value) return null;

      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date.getTime())) return null;

      return date.toISOString();
    })
  );
}

export default SerializeDate;
