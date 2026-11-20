import { count, eq, inArray, sql } from "drizzle-orm";
import { getDatabase } from "./client";
import { mapTask, type ScanTask } from "./tasks";
import * as schema from "../schema";

export interface Library {
  id: number;
  name: string;
  rootPath: string;
  createdAt: string;
  lastScanAt: string | null;
  imageCount: number;
  folderCount: number;
  totalSizeBytes: number;
  activeTask: ScanTask | null;
}

export function getLibrary(libraryId: number) {
  return getDatabase()
    .select()
    .from(schema.libraries)
    .where(eq(schema.libraries.id, libraryId))
    .get();
}

export function createLibrary(name: string, rootPath: string) {
  const [library] = getDatabase()
    .insert(schema.libraries)
    .values({ name, rootPath, createdAt: new Date().toISOString() })
    .returning({ id: schema.libraries.id })
    .all();
  return library.id;
}

export function findLibraryByRoot(rootPath: string) {
  return getDatabase()
    .select({ id: schema.libraries.id })
    .from(schema.libraries)
    .where(eq(schema.libraries.rootPath, rootPath))
    .get();
}

export function getLibraryList(): Library[] {
  const db = getDatabase();
  const libraryRows = db
    .select()
    .from(schema.libraries)
    .orderBy(sql`lower(${schema.libraries.name})`)
    .all();
  const entries = db
    .select({
      libraryId: schema.libraryEntries.libraryId,
      kind: schema.libraryEntries.kind,
      count: count(),
      totalSizeBytes: sql<number>`coalesce(sum(${schema.libraryEntries.size}), 0)`,
    })
    .from(schema.libraryEntries)
    .groupBy(schema.libraryEntries.libraryId, schema.libraryEntries.kind)
    .all();
  const activeTasks = db
    .select()
    .from(schema.scanTasks)
    .where(inArray(schema.scanTasks.status, ["queued", "running"]))
    .orderBy(schema.scanTasks.createdAt)
    .all();

  return libraryRows.map((library) => {
    const activeTask = activeTasks.find(
      (task) => task.libraryId === library.id,
    );
    return {
      id: library.id,
      name: library.name,
      rootPath: library.rootPath,
      createdAt: library.createdAt,
      lastScanAt: library.lastScanAt,
      imageCount:
        entries.find(
          (entry) => entry.libraryId === library.id && entry.kind === "image",
        )?.count ?? 0,
      totalSizeBytes: entries
        .filter(
          (entry) => entry.libraryId === library.id && entry.kind === "image",
        )
        .reduce((total, entry) => total + entry.totalSizeBytes, 0),
      folderCount:
        entries.find(
          (entry) =>
            entry.libraryId === library.id && entry.kind === "directory",
        )?.count ?? 0,
      activeTask: mapTask(activeTask),
    };
  });
}
