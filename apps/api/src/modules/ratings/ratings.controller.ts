import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { ApiResponse, PublicRatingListView, RentalRatingsView } from '@rentacar/shared';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@Controller()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('rentals/:rentalId/ratings')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('rentalId') rentalId: string,
    @Body() dto: CreateRatingDto,
  ): Promise<ApiResponse<RentalRatingsView>> {
    return this.ratingsService.submitRentalRating(rentalId, user.userId, dto);
  }

  @Get('rentals/:rentalId/ratings')
  getForRental(
    @CurrentUser() user: AuthenticatedUser,
    @Param('rentalId') rentalId: string,
  ): Promise<ApiResponse<RentalRatingsView>> {
    return this.ratingsService.getRentalRatings(rentalId, user.userId);
  }

  @Get('vehicles/:id/ratings')
  @Public()
  getForVehicle(@Param('id') id: string): Promise<ApiResponse<PublicRatingListView>> {
    return this.ratingsService.getVehicleRatings(id);
  }

  @Get('users/:id/renter-ratings')
  @Public()
  getForRenter(@Param('id') id: string): Promise<ApiResponse<PublicRatingListView>> {
    return this.ratingsService.getRenterRatings(id);
  }
}
