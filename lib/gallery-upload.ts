import fs from "node:fs";
import path from "node:path";
import {
  getDatabase,
  getLibrary,
  syncFolderAlbums,
  syncScannedImageMetadataBatch,
} from "./database";
import { GalleryPathError, IMAGE_CONTENT_TYPES } from "./gallery";
import { resolveLibraryPath } from "./gallery-actions";
import * as schema from "./schema";

export interface UploadItem {
  relativePath: string;
  buffer: Buffer;
  modifiedAt?: string;
}

export interface UploadResult {
  uploaded: { path: string; name: string }[];
  skipped: { path: string; reason: string }[];
}

export async function processUploadBatch(
  libraryId: number,
  targetFolder: string,
  items: UploadItem[],
): Promise<UploadResult> {
  const library = getLibrary(libraryId);
  if (!library) throw new GalleryPathError("Library not found.", 404);

  // Validate targetFolder within library
  const normalizedTarget = targetFolder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const { root } = resolveLibraryPath(library.rootPath, normalizedTarget, true);

  const db = getDatabase();
  const uploaded: { path: string; name: string }[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const newlyUploadedImages: Array<{ relativePath: string; absolutePath: string }> = [];

  // Track directories to register in DB
  const createdDirectories = new Set<string>();

  for (const item of items) {
    // Sanitize item relative path
    const sanitizedRel = item.relativePath
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter((seg) => seg && seg !== "." && seg !== "..")
      .join("/");

    if (!sanitizedRel) {
      skipped.push({ path: item.relativePath, reason: "Invalid file path." });
      continue;
    }

    const fullRelativePath = normalizedTarget
      ? `${normalizedTarget}/${sanitizedRel}`
      : sanitizedRel;

    const ext = path.extname(fullRelativePath).toLowerCase();
    if (!IMAGE_CONTENT_TYPES[ext]) {
      skipped.push({
        path: item.relativePath,
        reason: `Unsupported format (${ext || "no extension"}). Only images are supported.`,
      });
      continue;
    }

    // Resolve destination on disk
    const destAbsolute = path.resolve(root, fullRelativePath);
    const parentDirAbs = path.dirname(destAbsolute);
    const parentDirRel = path.posix.dirname(fullRelativePath);
    const normalizedParentRel = parentDirRel === "." ? "" : parentDirRel;

    try {
      // Ensure directory exists on disk
      if (!fs.existsSync(parentDirAbs)) {
        fs.mkdirSync(parentDirAbs, { recursive: true });
      }

      // Track all intermediate directories to save in DB
      let currentDir = normalizedParentRel;
      while (currentDir && !createdDirectories.has(currentDir)) {
        createdDirectories.add(currentDir);
        const parentOfCurrent = path.posix.dirname(currentDir);
        currentDir = parentOfCurrent === "." ? "" : parentOfCurrent;
      }

      // Write file
      await fs.promises.writeFile(destAbsolute, item.buffer);

      const stats = fs.statSync(destAbsolute);
      const fileName = path.posix.basename(fullRelativePath);

      // Atomic DB sync for directories & the file
      db.transaction((tx) => {
        // Register any newly encountered parent directories
        for (const dirPath of createdDirectories) {
          const dirParent = path.posix.dirname(dirPath);
          const dirParentNorm = dirParent === "." ? "" : dirParent;
          const dirName = path.posix.basename(dirPath);

          tx.insert(schema.libraryEntries)
            .values({
              libraryId,
              path: dirPath,
              parentPath: dirParentNorm,
              name: dirName,
              kind: "directory",
              extension: null,
              size: null,
              modifiedAt: new Date().toISOString(),
              scanId: "upload-op",
            })
            .onConflictDoUpdate({
              target: [schema.libraryEntries.libraryId, schema.libraryEntries.path],
              set: {
                parentPath: dirParentNorm,
                name: dirName,
                kind: "directory",
                modifiedAt: new Date().toISOString(),
              },
            })
            .run();
        }

        // Register the image entry
        tx.insert(schema.libraryEntries)
          .values({
            libraryId,
            path: fullRelativePath,
            parentPath: normalizedParentRel,
            name: fileName,
            kind: "image",
            extension: ext,
            size: stats.size,
            modifiedAt: item.modifiedAt || stats.mtime.toISOString(),
            scanId: "upload-op",
          })
          .onConflictDoUpdate({
            target: [schema.libraryEntries.libraryId, schema.libraryEntries.path],
            set: {
              parentPath: normalizedParentRel,
              name: fileName,
              kind: "image",
              extension: ext,
              size: stats.size,
              modifiedAt: item.modifiedAt || stats.mtime.toISOString(),
            },
          })
          .run();
      });

      uploaded.push({ path: fullRelativePath, name: fileName });
      newlyUploadedImages.push({
        relativePath: fullRelativePath,
        absolutePath: destAbsolute,
      });
    } catch (err) {
      skipped.push({
        path: item.relativePath,
        reason: err instanceof Error ? err.message : "Failed to write file.",
      });
    }
  }

  if (newlyUploadedImages.length > 0) {
    try {
      await syncScannedImageMetadataBatch(libraryId, newlyUploadedImages);
    } catch (metaErr) {
      console.warn("[Upload] Failed to sync photo metadata:", metaErr);
    }

    try {
      syncFolderAlbums(libraryId);
    } catch (albumErr) {
      console.warn("[Upload] Failed to sync folder albums:", albumErr);
    }
  }

  return { uploaded, skipped };
}
