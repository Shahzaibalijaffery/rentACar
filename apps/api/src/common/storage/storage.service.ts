export type StoredObject = {
  storageKey: string;
  url: string;
};

export type SaveObjectInput = {
  buffer: Buffer;
  mimeType: string;
  storageKey: string;
};

export abstract class StorageService {
  abstract saveObject(input: SaveObjectInput): Promise<StoredObject>;
  abstract deleteObject(storageKey: string): Promise<void>;
}
