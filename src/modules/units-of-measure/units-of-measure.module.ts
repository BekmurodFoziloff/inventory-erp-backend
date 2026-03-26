import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UnitOfMeasure, UnitOfMeasureSchema } from './unit-of-measure.schema';
import { UnitsOfMeasureController } from './units-of-measure.controller';
import { UnitsOfMeasureService } from './units-of-measure.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: UnitOfMeasure.name, schema: UnitOfMeasureSchema }])],
  controllers: [UnitsOfMeasureController],
  providers: [UnitsOfMeasureService]
})
export class UnitsOfMeasureModule {}
