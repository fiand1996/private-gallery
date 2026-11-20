"use client";

import {
  CheckCircle2,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useLibrary } from "@/components/layout/library-context";

interface ScanTask {
  id: string;
  libraryId: number;
  libraryName?: string;
  status: "queued" | "running" | "completed" | "failed";
  scannedEntries: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
}

interface LibrarySetting {
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

function formatDate(value: string | null) {
  if (!value) return "Never scanned";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)} ${units[unitIndex]}`;
}

export function LibrariesView() {
  const { refreshLibraries: refreshGlobalLibraries } = useLibrary();

  const [libraries, setLibraries] = useState<LibrarySetting[]>([]);
  const [name, setName] = useState("");
  const [rootPath, setRootPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/libraries", { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { libraries?: LibrarySetting[]; error?: string };
        if (!res.ok) throw new Error(data.error || "Failed to load libraries.");
        setLibraries(data.libraries ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load libraries.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey]);

  const hasActiveTasks = libraries.some(
    (lib) =>
      lib.activeTask?.status === "queued" || lib.activeTask?.status === "running",
  );

  useEffect(() => {
    if (!hasActiveTasks) return;
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
      void refreshGlobalLibraries();
    }, 1500);
    return () => clearInterval(interval);
  }, [hasActiveTasks, refreshGlobalLibraries]);

  const totalStats = libraries.reduce(
    (acc, lib) => ({
      images: acc.images + lib.imageCount,
      folders: acc.folders + lib.folderCount,
      bytes: acc.bytes + lib.totalSizeBytes,
    }),
    { images: 0, folders: 0, bytes: 0 },
  );

  async function addLibrary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/libraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rootPath }),
      });
      const data = (await response.json()) as { id?: number; error?: string };
      if (!response.ok || !data.id) {
        throw new Error(data.error || "Failed to add library.");
      }

      setName("");
      setRootPath("");
      setAddModalOpen(false);
      setNotice("Library added successfully! Click 'Scan Now' to index its contents.");
      setRefreshKey((k) => k + 1);
      void refreshGlobalLibraries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add library.");
    } finally {
      setSubmitting(false);
    }
  }

  async function scanLibrary(library: LibrarySetting) {
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libraryId: library.id }),
      });
      const data = (await response.json()) as { task?: ScanTask; error?: string };
      if (!response.ok || !data.task) {
        throw new Error(data.error || "Failed to start scan.");
      }

      setNotice(`Scan for “${library.name}” has been scheduled.`);
      setRefreshKey((k) => k + 1);
      void refreshGlobalLibraries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start scan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Global Alerts */}
      {notice && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-400">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-emerald-400/80 hover:text-emerald-300 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-400">
          <div className="flex items-center gap-2.5">
            <XCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-rose-400/80 hover:text-rose-300 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#8ab4f8]/10 text-[#8ab4f8]">
              <ImageIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Photos
              </p>
              <p className="text-xl font-bold text-zinc-100">
                {totalStats.images.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <FolderOpen size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Folders
              </p>
              <p className="text-xl font-bold text-zinc-100">
                {totalStats.folders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <HardDrive size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Size
              </p>
              <p className="text-xl font-bold text-zinc-100">
                {formatBytes(totalStats.bytes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configured Libraries List */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Configured Media Directories
            </h2>
            <p className="text-xs text-zinc-400">
              Root folders indexed by Private Gallery.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-[#262626] transition cursor-pointer"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#8ab4f8] px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-[#aecbfa] transition cursor-pointer shadow-sm"
            >
              <FolderPlus size={14} />
              Add Library
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-[#262626] bg-[#141414]">
            <Loader2 className="size-6 animate-spin text-[#8ab4f8]" />
          </div>
        ) : libraries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#262626] p-8 text-center text-sm text-zinc-400">
            <p>No libraries registered yet.</p>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#8ab4f8] px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-[#aecbfa] transition cursor-pointer shadow-sm"
            >
              <FolderPlus size={14} />
              Add Your First Library
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {libraries.map((lib) => {
              const isScanning =
                lib.activeTask?.status === "queued" ||
                lib.activeTask?.status === "running";
              const isFailed = lib.activeTask?.status === "failed";

              return (
                <div
                  key={lib.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-[#262626] bg-[#141414] p-5 transition sm:flex-row sm:items-center shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="truncate text-base font-bold text-zinc-100">
                        {lib.name}
                      </h3>
                      {isScanning ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-[#8ab4f8]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#8ab4f8]">
                          <Loader2 size={12} className="animate-spin" />
                          Scanning ({lib.activeTask?.scannedEntries} items)...
                        </span>
                      ) : isFailed ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
                          <XCircle size={12} />
                          Scan Failed
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#1c1c1c] px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                          Ready
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-xs text-zinc-400 truncate">
                      {lib.rootPath}
                    </p>
                    {isFailed && lib.activeTask?.error && (
                      <p className="mt-1 text-xs text-rose-400">
                        {lib.activeTask.error}
                      </p>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-zinc-400">
                      <span>{lib.imageCount.toLocaleString()} photos</span>
                      <span>·</span>
                      <span>{lib.folderCount.toLocaleString()} folders</span>
                      <span>·</span>
                      <span>{formatBytes(lib.totalSizeBytes)}</span>
                      <span>·</span>
                      <span>Last scan: {formatDate(lib.lastScanAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting || isScanning}
                      onClick={() => scanLibrary(lib)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#8ab4f8] px-4 py-2.5 text-xs font-semibold text-zinc-950 shadow-sm transition hover:bg-[#aecbfa] disabled:opacity-50 cursor-pointer"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          <span>Scan Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add New Library Modal */}
      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              setAddModalOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-library-title"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#8ab4f8]/10 text-[#8ab4f8]">
                  <FolderPlus size={18} />
                </div>
                <div>
                  <h2
                    id="add-library-title"
                    className="text-base font-bold text-zinc-100"
                  >
                    Add New Media Library
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Point to a local folder on your computer.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-[#262626] hover:text-zinc-200 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={addLibrary} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Library Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vacation Photos, Main Camera, etc."
                  className="h-10 w-full rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] px-3.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-[#8ab4f8] focus:bg-[#242424] focus:ring-2 focus:ring-[#8ab4f8]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Absolute Root Directory Path
                </label>
                <input
                  type="text"
                  required
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                  placeholder="e.g. /Users/vian/Pictures/Gallery or /Volumes/Storage/Photos"
                  className="h-10 w-full rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] px-3.5 font-mono text-xs text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-[#8ab4f8] focus:bg-[#242424] focus:ring-2 focus:ring-[#8ab4f8]/20"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-[#262626] hover:text-white transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#8ab4f8] px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm transition hover:bg-[#aecbfa] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FolderPlus size={14} />
                  )}
                  Save Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
