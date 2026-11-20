import { NextRequest, NextResponse } from "next/server";
import {
  createLibrary,
  findLibraryByRoot,
} from "@/lib/database";
import {
  ensureDefaultLibrary,
  validateLibraryRoot,
} from "@/lib/library-service";

export async function GET() {
  try {
    const libraries = ensureDefaultLibrary().map((library) => ({
      id: library.id,
      name: library.name,
      rootPath: library.rootPath,
      createdAt: library.createdAt,
      lastScanAt: library.lastScanAt,
      imageCount: library.imageCount,
      folderCount: library.folderCount,
      totalSizeBytes: library.totalSizeBytes,
      activeTask: library.activeTask,
    }));
    return NextResponse.json({ libraries });
  } catch (error) {
    console.error("Failed to load photo libraries:", error);
    return NextResponse.json(
      { error: "Libraries could not be loaded." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { name?: unknown; rootPath?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const requestedPath =
      typeof body.rootPath === "string" ? body.rootPath.trim() : "";

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "Library name must be between 1 and 100 characters." },
        { status: 400 },
      );
    }

    let rootPath: string;
    try {
      rootPath = validateLibraryRoot(requestedPath);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid library path." },
        { status: 400 },
      );
    }

    if (findLibraryByRoot(rootPath)) {
      return NextResponse.json(
        { error: "That folder is already registered as a library." },
        { status: 409 },
      );
    }

    const id = createLibrary(name, rootPath);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create photo library:", error);
    return NextResponse.json(
      { error: "Library could not be created." },
      { status: 500 },
    );
  }
}
