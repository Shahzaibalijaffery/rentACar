import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainError } from '../errors/domain.error';
import { AppConfig } from '../../config/env.config';
import { SaveObjectInput, StorageService, StoredObject } from './storage.service';

@Injectable()
export class R2StorageService extends StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    super();

    const accountId = this.configService.get('r2AccountId', { infer: true });
    const accessKeyId = this.configService.get('r2AccessKeyId', { infer: true });
    const secretAccessKey = this.configService.get('r2SecretAccessKey', { infer: true });
    this.bucketName = this.configService.get('r2BucketName', { infer: true });
    this.publicBaseUrl = this.configService.get('r2PublicBaseUrl', { infer: true }).replace(/\/$/, '');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async saveObject(input: SaveObjectInput): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: input.storageKey,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );

    const url = `${this.publicBaseUrl}/${input.storageKey}`;
    this.logger.log(`Stored object in R2 at ${input.storageKey}`);
    return { storageKey: input.storageKey, url };
  }

  async deleteObject(storageKey: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: storageKey,
        }),
      );
    } catch {
      this.logger.warn(`Failed to delete R2 object ${storageKey}`);
    }
  }
}
