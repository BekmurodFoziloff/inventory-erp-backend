import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attribute, AttributeSchema } from './attribute.schema';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Attribute.name, schema: AttributeSchema }])],
  controllers: [AttributesController],
  providers: [AttributesService]
})
export class AttributesModule {}
