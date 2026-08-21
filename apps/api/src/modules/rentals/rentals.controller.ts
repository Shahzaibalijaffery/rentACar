import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { ApiResponse, RentalDetailView, RentalSummary } from '@rentacar/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateRentalDto } from './dto/create-rental.dto';
import { ListRentalsQueryDto } from './dto/list-rentals-query.dto';
import { RentalsService } from './rentals.service';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRentalDto,
  ): Promise<ApiResponse<RentalSummary>> {
    return this.rentalsService.createRental(user.userId, dto);
  }

  @Get('mine')
  listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRentalsQueryDto,
  ): Promise<ApiResponse<RentalSummary[]>> {
    return this.rentalsService.listMyRentals(user.userId, query.lifecycle ?? 'all');
  }

  @Get('incoming')
  listIncoming(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRentalsQueryDto,
  ): Promise<ApiResponse<RentalSummary[]>> {
    return this.rentalsService.listIncomingRentals(user.userId, query.lifecycle ?? 'all');
  }

  @Get(':id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<RentalDetailView>> {
    return this.rentalsService.getRental(id, user.userId);
  }

  @Post(':id/accept')
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<RentalDetailView>> {
    return this.rentalsService.acceptRental(user.userId, id);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<RentalSummary>> {
    return this.rentalsService.rejectRental(user.userId, id);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<RentalSummary>> {
    return this.rentalsService.cancelRental(user.userId, id);
  }

  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<RentalDetailView>> {
    return this.rentalsService.completeRental(user.userId, id);
  }
}
