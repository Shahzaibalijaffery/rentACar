import { mkdir, unlink, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/env.config';
import { SaveObjectInput, StorageService, StoredObject } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly storageDir: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    super();
    this.storageDir = this.configService.get('storageLocalDir', { infer: true });
    this.publicBaseUrl = this.configService.get('storagePublicBaseUrl', { infer: true });
  }

  async saveObject(input: SaveObjectInput): Promise<StoredObject> {
    const absolutePath = join(this.storageDir, input.storageKey);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.buffer);

    const url = `${this.publicBaseUrl}/${input.storageKey}`;
    this.logger.log(`Stored object at ${input.storageKey}`);
    return { storageKey: input.storageKey, url };
  }

  async deleteObject(storageKey: string): Promise<void> {
    const absolutePath = join(this.storageDir, storageKey);
    try {
      await unlink(absolutePath);
    } catch {
      // Ignore missing files during cleanup.
    }
  }
}
