import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AreaSearchResult } from '@rentacar/shared';
import { DomainError } from '../../common/errors/domain.error';
import { validateCoordinates } from '../../common/utils/location.util';
import { AppConfig } from '../../config/env.config';

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

type NominatimReverseResult = {
  display_name?: string;
};

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async searchAreas(query: string): Promise<AreaSearchResult[]> {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return [];
    }

    const countryCodes = this.configService.get('geocodingCountryCodes', { infer: true });
    const userAgent = this.configService.get('geocodingUserAgent', { infer: true });
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', trimmedQuery);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '8');
    url.searchParams.set('addressdetails', '0');
    if (countryCodes) {
      url.searchParams.set('countrycodes', countryCodes);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Geocoding request failed';
      this.logger.warn(`Geocoding fetch failed: ${message}`);
      throw new DomainError('Area search is temporarily unavailable', 'GEOCODING_UNAVAILABLE', 503);
    }

    if (!response.ok) {
      this.logger.warn(`Geocoding upstream returned HTTP ${response.status}`);
      throw new DomainError('Area search is temporarily unavailable', 'GEOCODING_UNAVAILABLE', 503);
    }

    const payload = (await response.json()) as NominatimResult[];
    if (!Array.isArray(payload)) {
      return [];
    }

    const results: AreaSearchResult[] = [];

    for (const item of payload) {
      const parsed = this.toAreaSearchResult(item);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<AreaSearchResult> {
    const coordinates = validateCoordinates(latitude, longitude);
    const userAgent = this.configService.get('geocodingUserAgent', { infer: true });
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(coordinates.latitude));
    url.searchParams.set('lon', String(coordinates.longitude));
    url.searchParams.set('format', 'json');

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reverse geocoding failed';
      this.logger.warn(`Reverse geocoding fetch failed: ${message}`);
      throw new DomainError('Could not resolve this location', 'GEOCODING_UNAVAILABLE', 503);
    }

    if (!response.ok) {
      throw new DomainError('Could not resolve this location', 'GEOCODING_UNAVAILABLE', 503);
    }

    const payload = (await response.json()) as NominatimReverseResult;
    const label = payload.display_name?.trim();
    if (!label) {
      throw new DomainError('Could not resolve this location', 'GEOCODING_NOT_FOUND', 404);
    }

    return {
      label,
      areaLabel: toShortAreaLabel(label),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };
  }

  private toAreaSearchResult(item: NominatimResult): AreaSearchResult | null {
    const label = item.display_name?.trim();
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);

    if (!label || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }

    const coordinates = validateCoordinates(latitude, longitude);

    return {
      label,
      areaLabel: toShortAreaLabel(label),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };
  }
}

export function toShortAreaLabel(displayName: string): string {
  const parts = displayName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return displayName.slice(0, 80);
  }

  return parts.slice(0, 2).join(', ').slice(0, 80);
}
