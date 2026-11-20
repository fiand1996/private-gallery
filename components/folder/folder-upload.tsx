"use client";

import { ChevronDown, FolderUp, Loader2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UploadFileItem {
  file: File;
  relativePath: string;
}

export async function extractFilesFromDataTransfer(
  dataTransfer: DataTransfer,
): Promise<UploadFileItem[]> {
  const results: UploadFileItem[] = [];
  const items = Array.from(dataTransfer.items || []);

  type FileSystemEntry = {
    isFile: boolean;
    isDirectory: boolean;
    name: string;
    file?: (callback: (file: File) => void) => void;
    createReader?: () => {
      readEntries: (callback: (entries: FileSystemEntry[]) => void) => void;
    };
  };

  async function traverseEntry(entry: FileSystemEntry, currentPath: string): Promise<void> {
    if (entry.isFile && entry.file) {
      await new Promise<void>((resolve) => {
        entry.file!((file: File) => {
          results.push({
            file,
            relativePath: currentPath ? `${currentPath}/${file.name}` : file.name,
          });
          resolve();
        });
      });
    } else if (entry.isDirectory && entry.createReader) {
      const dirReader = entry.createReader();
      const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

      const readEntries = async (): Promise<void> => {
        return new Promise<void>((resolve) => {
          dirReader.readEntries(async (entries: FileSystemEntry[]) => {
            if (entries.length === 0) {
              resolve();
            } else {
              for (const child of entries) {
                await traverseEntry(child, nextPath);
              }
              await readEntries();
              resolve();
            }
          });
        });
      };
      await readEntries();
    }
  }

  const entries: FileSystemEntry[] = [];
  for (const item of items) {
    if (typeof (item as unknown as { webkitGetAsEntry?: () => FileSystemEntry }).webkitGetAsEntry === "function") {
      const entry = (item as unknown as { webkitGetAsEntry: () => FileSystemEntry }).webkitGetAsEntry();
      if (entry) entries.push(entry);
    }
  }

  if (entries.length > 0) {
    for (const entry of entries) {
      await traverseEntry(entry, "");
    }
  } else {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      results.push({ file, relativePath: file.name });
    }
  }

  return results;
}

interface UseFolderUploadOptions {
  libraryId: number;
  folderPath: string;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export function useFolderUpload({
  libraryId,
  folderPath,
  onSuccess,
  onError,
}: UseFolderUploadOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);

  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // Close upload menu on outside click
  useEffect(() => {
    if (!uploadMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!uploadMenuRef.current?.contains(e.target as Node)) {
        setUploadMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", handleClickOutside);
    return () => window.removeEventListener("pointerdown", handleClickOutside);
  }, [uploadMenuOpen]);

  const startUpload = useCallback(
    async (items: UploadFileItem[]) => {
      if (items.length === 0) return;
      setUploading(true);
      setUploadProgress({ total: items.length, current: 0 });

      const CHUNK_SIZE = 5;
      let successCount = 0;
      const failedReasons: string[] = [];

      try {
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
          const chunk = items.slice(i, i + CHUNK_SIZE);
          const formData = new FormData();
          formData.append("libraryId", String(libraryId));
          formData.append("targetFolder", folderPath);

          for (const item of chunk) {
            formData.append("files", item.file);
            formData.append("paths", item.relativePath);
          }

          const res = await fetch("/api/gallery/upload", {
            method: "POST",
            body: formData,
          });

          const json = (await res.json()) as {
            success?: boolean;
            uploadedCount?: number;
            skippedCount?: number;
            skipped?: { path: string; reason: string }[];
            error?: string;
          };

          if (!res.ok) {
            throw new Error(json.error || "Upload failed.");
          }

          successCount += json.uploadedCount ?? 0;
          if (json.skipped && json.skipped.length > 0) {
            for (const s of json.skipped) {
              failedReasons.push(`${s.path}: ${s.reason}`);
            }
          }

          setUploadProgress({
            total: items.length,
            current: Math.min(items.length, i + chunk.length),
          });
        }

        let msg = `Successfully uploaded ${successCount} photo(s).`;
        if (failedReasons.length > 0) {
          msg += ` (${failedReasons.length} item(s) skipped)`;
        }
        onSuccess(msg);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [folderPath, libraryId, onError, onSuccess],
  );

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const items: UploadFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      items.push({ file, relativePath: file.name });
    }
    startUpload(items);
    e.target.value = "";
  };

  const handleDirectorySelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const items: UploadFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const rel = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || file.name;
      items.push({ file, relativePath: rel });
    }
    startUpload(items);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer) return;
    const items = await extractFilesFromDataTransfer(e.dataTransfer);
    if (items.length > 0) {
      startUpload(items);
    }
  };

  const UploadMenu = (
    <div ref={uploadMenuRef} className="relative">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif"
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        ref={dirInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in WebKit/Blink
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleDirectorySelected}
        className="hidden"
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => setUploadMenuOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-xl bg-[#8ab4f8] px-3.5 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm transition hover:bg-[#aecbfa] disabled:opacity-50 cursor-pointer"
      >
        <Upload size={14} />
        <span>Upload</span>
        <ChevronDown size={13} className="opacity-70" />
      </button>

      {uploadMenuOpen && (
        <div className="absolute right-0 top-full mt-2 z-30 w-44 overflow-hidden rounded-2xl border border-[#2e2e2e] bg-[#161616]/98 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setUploadMenuOpen(false);
              fileInputRef.current?.click();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-200 transition hover:bg-[#212121] cursor-pointer"
          >
            <Upload size={14} className="text-[#8ab4f8]" />
            <span>Upload Files</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadMenuOpen(false);
              dirInputRef.current?.click();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-200 transition hover:bg-[#212121] cursor-pointer"
          >
            <FolderUp size={14} className="text-[#8ab4f8]" />
            <span>Upload Folder</span>
          </button>
        </div>
      )}
    </div>
  );

  const UploadProgressToast = uploading ? (
    <div className="fixed bottom-6 right-6 z-50 flex w-80 items-center gap-3.5 rounded-2xl border border-[#2e2e2e] bg-[#161616]/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-200">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#8ab4f8]/15 text-[#8ab4f8]">
        <Loader2 size={20} className="animate-spin" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-100">
          <span>Uploading Media...</span>
          <span>
            {uploadProgress.total > 0
              ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#262626]">
          <div
            className="h-full bg-[#8ab4f8] transition-all duration-200"
            style={{
              width: `${
                uploadProgress.total > 0
                  ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
                  : 0
              }%`,
            }}
          />
        </div>
        <p className="mt-1 truncate text-[11px] text-zinc-400">
          {uploadProgress.current} of {uploadProgress.total} file(s)
        </p>
      </div>
    </div>
  ) : null;

  return {
    uploading,
    uploadProgress,
    isDragging,
    setIsDragging,
    handleDrop,
    UploadMenu,
    UploadProgressToast,
  };
}
