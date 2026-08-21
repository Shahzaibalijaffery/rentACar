import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { ApiResponse, RentalAgreementView } from '@rentacar/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AgreementsService } from './agreements.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';

@Controller()
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Post('rentals/:rentalId/agreement')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('rentalId') rentalId: string,
    @Body() dto: CreateAgreementDto,
  ): Promise<ApiResponse<RentalAgreementView>> {
    return this.agreementsService.createAgreement(user.userId, rentalId, dto);
  }

  @Get('rentals/:rentalId/agreement')
  getByRental(
    @CurrentUser() user: AuthenticatedUser,
    @Param('rentalId') rentalId: string,
  ): Promise<ApiResponse<RentalAgreementView>> {
    return this.agreementsService.getAgreementByRental(rentalId, user.userId);
  }

  @Get('agreements/:id')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<RentalAgreementView>> {
    return this.agreementsService.getAgreement(id, user.userId);
  }

  @Post('agreements/:id/approve')
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<RentalAgreementView>> {
    return this.agreementsService.approveAgreement(user.userId, id);
  }

  @Post('agreements/:id/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<RentalAgreementView>> {
    return this.agreementsService.cancelAgreement(user.userId, id);
  }
}
