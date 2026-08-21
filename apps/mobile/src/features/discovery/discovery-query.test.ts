import { buildDiscoveryQueryString } from '@/features/discovery/discovery-query';

describe('buildDiscoveryQueryString', () => {
  it('builds a discovery query with pagination and filters', () => {
    const query = buildDiscoveryQueryString({
      latitude: 24.86,
      longitude: 67.0,
      radiusKm: 10,
      make: 'Toyota',
      page: 2,
      pageSize: 20,
      availability: 'AVAILABLE',
    });

    expect(query).toContain('latitude=24.86');
    expect(query).toContain('longitude=67');
    expect(query).toContain('radiusKm=10');
    expect(query).toContain('make=Toyota');
    expect(query).toContain('page=2');
    expect(query).toContain('availability=AVAILABLE');
  });
});
