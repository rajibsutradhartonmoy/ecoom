import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto';
import { SuperAdminGuard } from '@/common/guards';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(SuperAdminGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Tenant already exists' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants with pagination (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of tenants' })
  findAll(@Query() query: TenantQueryDto) {
    return this.tenantsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get tenant statistics (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant statistics' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.getStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Conflict with existing tenant' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tenant (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.remove(id);
  }
}
