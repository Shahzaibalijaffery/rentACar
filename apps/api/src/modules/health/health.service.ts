import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '../../common/storage/storage.service';
import type { StorageProbeResult } from './health.types';
import { PrismaService } from '../../common/database/prisma.service';

const PROBE_PAYLOAD = 'rentacar-storage-probe';
const PROBE_MIME_TYPE = 'text/plain';
const PUBLIC_FETCH_TIMEOUT_MS = 10_000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  getStorageDriver(): 'r2' {
    return 'r2';
  }

  async checkDatabase(): Promise<'connected' | 'disconnected'> {
    try {
      await this.prisma.$runCommandRaw({ ping: 1 });
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  async probeStorage(): Promise<StorageProbeResult> {
    const driver = this.getStorageDriver();
    const steps = { upload: false, publicAccess: false };
    const storageKey = `_health-checks/probe-${randomUUID()}.txt`;

    try {
      const stored = await this.storageService.saveObject({
        storageKey,
        buffer: Buffer.from(PROBE_PAYLOAD, 'utf8'),
        mimeType: PROBE_MIME_TYPE,
      });
      steps.upload = true;

      const publicResponse = await this.fetchPublicObject(stored.url);
      steps.publicAccess =
        publicResponse.ok && (await publicResponse.text()) === PROBE_PAYLOAD;

      if (steps.publicAccess) {
        return {
          driver,
          status: 'ok',
          steps,
          sampleUrl: stored.url,
          message: 'Storage upload and public access are working.',
        };
      }

      return {
        driver,
        status: 'error',
        steps,
        sampleUrl: stored.url,
        message: steps.upload
          ? `Upload succeeded but public URL returned HTTP ${publicResponse.status}. Check R2_PUBLIC_BASE_URL and bucket public access.`
          : 'Storage probe failed before upload completed.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Storage probe failed.';
      this.logger.warn(`Storage probe failed: ${message}`);

      return {
        driver,
        status: 'error',
        steps,
        message,
      };
    } finally {
      if (steps.upload) {
        await this.storageService.deleteObject(storageKey);
      }
    }
  }

  private async fetchPublicObject(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PUBLIC_FETCH_TIMEOUT_MS);

    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }
}
