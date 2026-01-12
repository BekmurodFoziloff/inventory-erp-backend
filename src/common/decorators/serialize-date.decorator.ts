import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

function SerializeDate() {
  return applyDecorators(Transform(({ value }) => (value instanceof Date ? value.toISOString() : value)));
}

export default SerializeDate;
