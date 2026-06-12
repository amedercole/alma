import { env } from "@/server/config/env";
import { LocalStorageProvider } from "@/server/storage/providers/local.provider";
import type { StorageService } from "@/server/storage/storage.service";

/**
 * Selects the storage provider from configuration. Only `local` is implemented
 * (disk / Railway volume); an `s3` provider can be added behind the same
 * interface without changing callers. See DESIGN.md.
 */
function createStorageService(): StorageService {
  switch (env.STORAGE_DRIVER) {
    case "local":
      return new LocalStorageProvider(env.STORAGE_LOCAL_DIR);
    case "s3":
      throw new Error(
        "STORAGE_DRIVER=s3 is not implemented yet; use 'local'.",
      );
    default:
      throw new Error(`Unknown STORAGE_DRIVER: ${env.STORAGE_DRIVER}`);
  }
}

export const storage: StorageService = createStorageService();
export type { StorageService } from "@/server/storage/storage.service";
