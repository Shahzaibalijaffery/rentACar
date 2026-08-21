import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { ApiResponse, AreaSearchResult } from '@rentacar/shared';
import { GeocodingService } from './geocoding.service';
import { ReverseGeocodeQueryDto } from './dto/reverse-geocode.dto';
import { SearchAreasQueryDto } from './dto/search-areas.dto';

@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('areas')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  searchAreas(@Query() query: SearchAreasQueryDto): Promise<ApiResponse<AreaSearchResult[]>> {
    return this.geocodingService.searchAreas(query.q).then((data) => ({ data }));
  }

  @Get('reverse')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  reverseGeocode(@Query() query: ReverseGeocodeQueryDto): Promise<ApiResponse<AreaSearchResult>> {
    return this.geocodingService
      .reverseGeocode(query.latitude, query.longitude)
      .then((data) => ({ data }));
  }
}
