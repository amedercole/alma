/**
 * Storage abstraction for binary files (resumes/CVs).
 *
 * The rest of the app depends only on this interface, so the backing store can
 * change (local disk / Railway volume / S3) without touching business logic.
 * The DB stores the returned opaque `key`; bytes live in the provider.
 */
export interface SaveFileInput {
  /** Raw file bytes. */
  data: Uint8Array;
  /** Original filename, used to derive a sensible extension. */
  filename: string;
  /** MIME type of the file. */
  contentType: string;
}

export interface StorageService {
  /** Persists bytes and returns an opaque key to retrieve them later. */
  save(input: SaveFileInput): Promise<{ key: string }>;
  /** Reads previously stored bytes by key. Throws if the key is unknown. */
  read(key: string): Promise<Uint8Array>;
  /** Removes a stored object. No-op if it does not exist. */
  delete(key: string): Promise<void>;
}
