import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PurchaseReceiptController } from './purchase-receipt.controller';
import { PurchaseReceiptService } from './purchase-receipt.service';
import { PurchaseReceipt, PurchaseReceiptSchema } from './schemas/purchase-receipt.schema';
import { Product, ProductSchema } from '../products/products.schema';
import { StockBalance, StockBalanceSchema } from '../inventory/schemas/stock-balance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { 
        name: PurchaseReceipt.name, 
        schema: PurchaseReceiptSchema 
      },
      { 
        name: Product.name, 
        schema: ProductSchema 
      },
      { 
        name: StockBalance.name, 
        schema: StockBalanceSchema 
      },
    ]),
  ],
  controllers: [PurchaseReceiptController],
  providers: [PurchaseReceiptService],
  exports: [PurchaseReceiptService],
})
export class PurchasingModule {}