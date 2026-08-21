import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { ApiResponse } from '@rentacar/shared';
import type { VehicleOwnerView, VehiclePublicView } from '@rentacar/shared';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  CreateVehicleDto,
  UpdateVehicleAvailabilityDto,
  UpdateVehicleDto,
} from './dto/vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVehicleDto,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    return this.vehiclesService.createVehicle(user.userId, dto);
  }

  @Get('mine')
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('includeArchived') includeArchived?: string,
  ): Promise<ApiResponse<VehicleOwnerView[]>> {
    return this.vehiclesService.listMyVehicles(user.userId, includeArchived === 'true');
  }

  @Get(':id/public')
  @Public()
  getPublic(@Param('id') id: string): Promise<ApiResponse<VehiclePublicView>> {
    return this.vehiclesService.getPublicVehicle(id);
  }

  @Get(':id')
  getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    return this.vehiclesService.getMyVehicle(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    return this.vehiclesService.updateVehicle(user.userId, id, dto);
  }

  @Delete(':id')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ message: string }>> {
    return this.vehiclesService.archiveVehicle(user.userId, id);
  }

  @Patch(':id/availability')
  updateAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleAvailabilityDto,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    return this.vehiclesService.updateAvailability(user.userId, id, dto);
  }

  @Post(':id/photos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    return this.vehiclesService.addPhoto(user.userId, id, file);
  }

  @Delete(':id/photos/:photoId')
  deletePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    return this.vehiclesService.deletePhoto(user.userId, id, photoId);
  }
}
