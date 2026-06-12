import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { NotFoundError } from "@/lib/errors";
import type {
  SaveFileInput,
  StorageService,
} from "@/server/storage/storage.service";

/**
 * Stores files on the local filesystem under a base directory. In production
 * this directory is a mounted Railway volume so uploads persist across deploys.
 *
 * Keys are randomly generated (`<uuid><ext>`), so they are safe against path
 * traversal; reads still `basename` the key as defense in depth.
 */
export class LocalStorageProvider implements StorageService {
  constructor(private readonly baseDir: string) {}

  private resolve(key: string): string {
    return path.join(this.baseDir, path.basename(key));
  }

  async save(input: SaveFileInput): Promise<{ key: string }> {
    await mkdir(this.baseDir, { recursive: true });
    const ext = path.extname(input.filename);
    const key = `${randomUUID()}${ext}`;
    await writeFile(this.resolve(key), input.data);
    return { key };
  }

  async read(key: string): Promise<Uint8Array> {
    try {
      return await readFile(this.resolve(key));
    } catch (error) {
      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        throw new NotFoundError("Stored file not found");
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}
