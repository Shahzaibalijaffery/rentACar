import { VehicleAvailability } from '@prisma/client';
import { validateCoordinates } from '../../common/utils/location.util';
import { toVehicleDiscoveryItem, assertDiscoveryItemIsPublicSafe } from './discovery.mapper';
import { DiscoveryRepository } from './discovery.repository';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService', () => {
  let service: DiscoveryService;
  let repository: jest.Mocked<DiscoveryRepository>;

  beforeEach(() => {
    repository = {
      ensureGeoSpatialIndex: jest.fn(),
      backfillVehicleLocations: jest.fn(),
      discoverNearby: jest.fn(),
    };

    service = new DiscoveryService(repository);
  });

  it('returns paginated discovery results sorted by distance from repository', async () => {
    repository.discoverNearby.mockResolvedValue({
      items: [
        {
          _id: 'vehicle-1',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          color: 'White',
          availability: VehicleAvailability.AVAILABLE,
          areaLabel: 'Clifton',
          distanceMeters: 850,
          photos: [],
          owner: {
            _id: 'owner-1',
            fullName: 'Owner One',
            profilePhotoUrl: null,
          },
        },
      ],
      total: 1,
    });

    const result = await service.discoverVehicles({
      latitude: 24.86,
      longitude: 67.0,
      page: 1,
      pageSize: 20,
      availability: VehicleAvailability.AVAILABLE,
    });

    expect(repository.discoverNearby).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 24.86,
        longitude: 67.0,
        radiusKm: 10,
        page: 1,
        pageSize: 20,
      }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.distanceLabel).toBe('850 m away');
    expect(result.meta.total).toBe(1);
    assertDiscoveryItemIsPublicSafe(result.data[0]!);
  });

  it('rejects invalid coordinates', async () => {
    await expect(
      service.discoverVehicles({
        latitude: 100,
        longitude: 67,
        availability: VehicleAvailability.AVAILABLE,
      }),
    ).rejects.toThrow();
  });
});

describe('DiscoveryRepository pipeline', () => {
  it('builds a geoNear-first aggregation pipeline', async () => {
    const aggregateRaw = jest.fn().mockResolvedValue([{ data: [], meta: [{ total: 0 }] }]);
    const prisma = {
      $runCommandRaw: jest.fn().mockResolvedValue({ ok: 1 }),
      vehicle: {
        aggregateRaw,
      },
    };

    const repository = new DiscoveryRepository(prisma as never);

    await repository.discoverNearby({
      latitude: 24.86,
      longitude: 67.0,
      radiusKm: 5,
      page: 1,
      pageSize: 10,
      make: 'Toyota',
      availability: VehicleAvailability.AVAILABLE,
    });

    const firstCall = aggregateRaw.mock.calls[0] as
      [{ pipeline: Record<string, unknown>[] }] | undefined;
    const pipeline = firstCall?.[0]?.pipeline ?? [];

    expect(pipeline[0]).toHaveProperty('$geoNear');
    expect(JSON.stringify(pipeline)).toContain('Toyota');
    expect(JSON.stringify(pipeline)).not.toContain('email');
    expect(JSON.stringify(pipeline)).not.toContain('cnic');
  });
});

describe('toVehicleDiscoveryItem', () => {
  it('maps raw aggregate documents without exposing private owner fields', () => {
    const item = toVehicleDiscoveryItem({
      _id: 'vehicle-1',
      make: 'Honda',
      model: 'Civic',
      year: 2019,
      color: 'Black',
      availability: VehicleAvailability.AVAILABLE,
      areaLabel: 'DHA',
      distanceMeters: 1250,
      photos: [],
      owner: {
        _id: 'owner-1',
        fullName: 'Public Owner',
        profilePhotoUrl: null,
        email: 'secret@example.com',
        cnic: '3520212345671',
        phone: '+923009999999',
      },
    });

    expect(item.owner.fullName).toBe('Public Owner');
    expect(item).not.toHaveProperty('latitude');
    expect(JSON.stringify(item)).not.toContain('secret@example.com');
    expect(JSON.stringify(item)).not.toContain('3520212345671');
    expect(JSON.stringify(item)).not.toContain('+923009999999');
  });
});

describe('validateCoordinates integration', () => {
  it('rounds search coordinates before querying', () => {
    const coords = validateCoordinates(24.123456, 67.987654);
    expect(coords.latitude).toBe(24.123);
    expect(coords.longitude).toBe(67.988);
  });
});
