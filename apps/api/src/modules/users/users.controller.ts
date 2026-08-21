import { Controller, Get, Patch, Body, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { AgreementParticipant, ApiResponse, UserProfile, UserProfileSearchResult } from '@rentacar/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { LookupUserByCnicDto } from './dto/lookup-user-by-cnic.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMyProfile(@CurrentUser() currentUser: AuthenticatedUser): Promise<ApiResponse<UserProfile>> {
    return this.usersService.getMyProfile(currentUser);
  }

  @Post('lookup-by-cnic')
  lookupByCnic(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: LookupUserByCnicDto,
  ): Promise<ApiResponse<AgreementParticipant>> {
    return this.usersService.lookupByCnic(currentUser, dto.cnic);
  }

  @Post('search-by-cnic')
  searchByCnic(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: LookupUserByCnicDto,
  ): Promise<ApiResponse<UserProfileSearchResult>> {
    return this.usersService.searchByCnic(currentUser, dto.cnic);
  }

  @Patch('me')
  updateMyProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ApiResponse<UserProfile>> {
    return this.usersService.updateMyProfile(currentUser, dto);
  }

  @Post('me/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProfilePhoto(
    @CurrentUser() currentUser: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse<UserProfile>> {
    return this.usersService.uploadProfilePhoto(currentUser, file);
  }
}
