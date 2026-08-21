import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import type { ApiResponse, HandoverView } from '@rentacar/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { HandoversService } from './handovers.service';

@Controller()
export class HandoversController {
  constructor(private readonly handoversService: HandoversService) {}

  @Post('rentals/:rentalId/handovers/pickup')
  createPickup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('rentalId') rentalId: string,
  ): Promise<ApiResponse<HandoverView>> {
    return this.handoversService.createPickupHandover(user.userId, rentalId);
  }

  @Get('rentals/:rentalId/handovers/pickup')
  getPickupByRental(
    @CurrentUser() user: AuthenticatedUser,
    @Param('rentalId') rentalId: string,
  ): Promise<ApiResponse<HandoverView>> {
    return this.handoversService.getPickupHandoverByRental(rentalId, user.userId);
  }

  @Get('handovers/:id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<HandoverView>> {
    return this.handoversService.getHandover(id, user.userId);
  }

  @Post('handovers/:id/photos')
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
  ): Promise<ApiResponse<HandoverView>> {
    return this.handoversService.uploadPhoto(user.userId, id, file);
  }

  @Delete('handovers/:id/photos/:photoId')
  deletePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ): Promise<ApiResponse<HandoverView>> {
    return this.handoversService.deletePhoto(user.userId, id, photoId);
  }

  @Post('handovers/:id/submit')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<HandoverView>> {
    return this.handoversService.submitHandover(user.userId, id);
  }

  @Post('handovers/:id/approve')
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<HandoverView>> {
    return this.handoversService.approveHandover(user.userId, id);
  }

  @Get('handovers/:handoverId/photos/:photoId/content')
  async getPhotoContent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('handoverId') handoverId: string,
    @Param('photoId') photoId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, mimeType } = await this.handoversService.getPhotoContent(
      handoverId,
      photoId,
      user.userId,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, no-store');
    return stream;
  }
}
