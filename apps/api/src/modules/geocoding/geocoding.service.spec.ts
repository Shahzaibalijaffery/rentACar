import { ConfigService } from '@nestjs/config';
import { GeocodingService, toShortAreaLabel } from './geocoding.service';

describe('GeocodingService', () => {
  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        geocodingCountryCodes: 'pk',
        geocodingUserAgent: 'RentACar-Test/1.0',
      };
      return values[key];
    }),
  } as unknown as ConfigService;

  let service: GeocodingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GeocodingService(configService);
  });

  it('maps nominatim results to area search items', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: 'Clifton, Karachi, Sindh, Pakistan',
          lat: '24.813800',
          lon: '67.029900',
        },
      ],
    } as Response);

    const results = await service.searchAreas('Clifton Karachi');

    expect(results).toEqual([
      {
        label: 'Clifton, Karachi, Sindh, Pakistan',
        areaLabel: 'Clifton, Karachi',
        latitude: 24.814,
        longitude: 67.03,
      },
    ]);
  });

  it('returns empty list for single-character queries without calling upstream', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(service.searchAreas('a')).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('toShortAreaLabel', () => {
  it('uses the first two comma-separated parts', () => {
    expect(toShortAreaLabel('Clifton, Karachi, Sindh, Pakistan')).toBe('Clifton, Karachi');
  });
});
