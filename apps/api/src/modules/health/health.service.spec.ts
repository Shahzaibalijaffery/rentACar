import { HealthService } from './health.service';
import { PrismaService } from '../../common/database/prisma.service';
import { StorageService } from '../../common/storage/storage.service';

describe('HealthService', () => {
  const prisma = {
    $runCommandRaw: jest.fn(),
  } as unknown as PrismaService;

  const storageService = {
    saveObject: jest.fn(),
    deleteObject: jest.fn(),
  } as unknown as StorageService;

  let service: HealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HealthService(prisma, storageService);
  });

  it('reports connected database when ping succeeds', async () => {
    jest.spyOn(prisma, '$runCommandRaw').mockResolvedValue({ ok: 1 });

    await expect(service.checkDatabase()).resolves.toBe('connected');
  });

  it('reports storage probe ok when upload and public fetch succeed', async () => {
    jest.spyOn(storageService, 'saveObject').mockResolvedValue({
      storageKey: '_health-checks/probe-test.txt',
      url: 'https://cdn.example.com/_health-checks/probe-test.txt',
    });
    jest.spyOn(storageService, 'deleteObject').mockResolvedValue(undefined);
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'rentacar-storage-probe',
    } as Response);

    const result = await service.probeStorage();

    expect(result.status).toBe('ok');
    expect(result.driver).toBe('r2');
    expect(result.steps.upload).toBe(true);
    expect(result.steps.publicAccess).toBe(true);
    expect(storageService.deleteObject).toHaveBeenCalled();
  });

  it('reports storage probe error when public fetch fails', async () => {
    jest.spyOn(storageService, 'saveObject').mockResolvedValue({
      storageKey: '_health-checks/probe-test.txt',
      url: 'https://cdn.example.com/_health-checks/probe-test.txt',
    });
    jest.spyOn(storageService, 'deleteObject').mockResolvedValue(undefined);
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    } as Response);

    const result = await service.probeStorage();

    expect(result.status).toBe('error');
    expect(result.steps.upload).toBe(true);
    expect(result.steps.publicAccess).toBe(false);
    expect(result.message).toContain('HTTP 403');
  });
});
