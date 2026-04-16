import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttributeValue, AttributeValueSchema } from './attribute-value.schema';
import { AttributeValuesController } from './attribute-values.controller';
import { AttributeValuesService } from './attribute-values.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: AttributeValue.name, schema: AttributeValueSchema }])],
  controllers: [AttributeValuesController],
  providers: [AttributeValuesService]
})
export class AttributeValuesModule {}
