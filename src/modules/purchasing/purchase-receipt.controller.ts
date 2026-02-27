import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Patch, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { PurchaseReceiptService } from './purchase-receipt.service';
import { CreatePurchaseReceiptDto, CancelReceiptDto } from './dto/create-purchase-receipt.dto';
import { PurchaseReceipt } from './purchase-receipt.schema';

@Controller('purchase-receipts')
export class PurchaseReceiptController {
  constructor(private readonly purchaseReceiptService: PurchaseReceiptService) {}

  /**
   * Creates a new purchase receipt in DRAFT status.
   */
  @Post()
  async create(@Body() createReceiptDto: CreatePurchaseReceiptDto): Promise<PurchaseReceipt> {
    return this.purchaseReceiptService.create(createReceiptDto);
  }

  /**
   * Retrieves a single purchase receipt by ID.
   */
  @Get(':id')
  async findOne(@Param('id') receiptId: string): Promise<PurchaseReceipt> {
    return this.purchaseReceiptService.findOne(receiptId);
  }

  /**
   * Confirms the receipt, increases stock, and makes the document immutable.
   */
  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Param('id') receiptId: string): Promise<PurchaseReceipt> {
    return this.purchaseReceiptService.confirm(receiptId);
  }

  /**
   * Cancels a confirmed receipt and reverts stock impact.
   */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') receiptId: string, 
    @Body() cancelDto: CancelReceiptDto
  ): Promise<PurchaseReceipt> {
    return this.purchaseReceiptService.cancel(receiptId, cancelDto.reason);
  }
}