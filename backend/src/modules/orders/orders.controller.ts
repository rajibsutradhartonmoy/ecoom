import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto, OrderQueryDto } from './dto';
import { TenantGuard, RbacGuard } from '@/common/guards';
import { TenantId, Permissions, Permission } from '@/common/decorators';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(TenantGuard, RbacGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Permissions(Permission.ORDERS_READ)
  @ApiOperation({ summary: 'List orders with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  findAll(@TenantId() tenantId: string, @Query() query: OrderQueryDto) {
    return this.ordersService.findAll(tenantId, query);
  }

  @Get(':id')
  @Permissions(Permission.ORDERS_READ)
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(tenantId, id);
  }

  @Patch(':id/status')
  @Permissions(Permission.ORDERS_UPDATE)
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  updateStatus(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(tenantId, id, dto);
  }
}
