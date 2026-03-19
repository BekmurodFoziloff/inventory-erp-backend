import { SetMetadata, Type } from '@nestjs/common';

export const SERIALIZE_TO_KEY = 'serialize_to_key';
export const SerializeTo = (entity: Type) => SetMetadata(SERIALIZE_TO_KEY, entity);
