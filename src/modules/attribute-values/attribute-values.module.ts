import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttributeValue, AttributeValueSchema } from './attribute-value.schema';
import { Attribute, AttributeSchema } from '@modules/attributes/attribute.schema';
import { AttributeValuesController } from './attribute-values.controller';
import { AttributeValuesService } from './attribute-values.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AttributeValue.name, schema: AttributeValueSchema },
      { name: Attribute.name, schema: AttributeSchema }
    ])
  ],
  controllers: [AttributeValuesController],
  providers: [AttributeValuesService]
})
export class AttributeValuesModule {}
