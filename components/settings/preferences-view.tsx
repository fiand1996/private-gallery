"use client";

import {
  ArrowDownAZ,
  Check,
  CheckCircle2,
  Database,
  Grid2X2,
  HardDrive,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAppSettings } from "@/components/layout/settings-context";
import {
  type GallerySort,
  type GridSize,
} from "@/components/gallery/grid-controls";

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

export function PreferencesView() {
  const { settings, updateSetting, updateSettings } = useAppSettings();
  const currentGridSize = settings.defaultGridSize;
  const currentSort = settings.defaultSort;
  const [prefNotice, setPrefNotice] = useState("");

  // Cache storage state
  const [cacheStats, setCacheStats] = useState<{
    thumbnailCount: number;
    totalSizeBytes: number;
  } | null>(null);
  const [loadingCacheStats, setLoadingCacheStats] = useState(true);
  const [purgingCache, setPurgingCache] = useState(false);
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCacheStats() {
      try {
        const res = await fetch("/api/settings/cache", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as {
            thumbnailCount: number;
            totalSizeBytes: number;
          };
          if (isMounted) setCacheStats(data);
        }
      } catch (err) {
        console.warn("Failed to load thumbnail cache stats:", err);
      } finally {
        if (isMounted) setLoadingCacheStats(false);
      }
    }
    loadCacheStats();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handlePurgeCache() {
    setPurgingCache(true);
    try {
      const res = await fetch("/api/settings/cache", { method: "DELETE" });
      const data = (await res.json()) as { success?: boolean; deletedCount?: number };
      if (res.ok && data.success) {
        setCacheStats({ thumbnailCount: 0, totalSizeBytes: 0 });
        setConfirmPurgeOpen(false);
        setPrefNotice(
          `Thumbnail cache cleared successfully (${data.deletedCount ?? 0} files purged).`,
        );
        setTimeout(() => setPrefNotice(""), 3500);
      }
    } catch (err) {
      console.error("Failed to purge thumbnail cache:", err);
    } finally {
      setPurgingCache(false);
    }
  }

  function handleSelectGridSize(size: GridSize) {
    void updateSetting("defaultGridSize", size);
    setPrefNotice(`Default grid size updated to “${size}” (saved to database).`);
    setTimeout(() => setPrefNotice(""), 3000);
  }

  function handleSelectSort(sort: GallerySort) {
    void updateSetting("defaultSort", sort);
    const sortLabel =
      sort === "modified-desc"
        ? "Latest"
        : sort === "name-asc"
          ? "Name (A–Z)"
          : "Name (Z–A)";
    setPrefNotice(`Default sort order updated to “${sortLabel}” (saved to database).`);
    setTimeout(() => setPrefNotice(""), 3000);
  }

  function handleResetPreferences() {
    void updateSettings({
      defaultGridSize: "medium",
      defaultSort: "modified-desc",
    });
    try {
      window.localStorage.removeItem("gallery-library-id");
    } catch {
      // ignore
    }
    setPrefNotice("Preferences reset to defaults (saved to database).");
    setTimeout(() => setPrefNotice(""), 3000);
  }

  return (
    <div className="space-y-6">
      {prefNotice && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-400">
          <CheckCircle2 size={16} />
          <span>{prefNotice}</span>
        </div>
      )}

      {/* Grid Size Preference */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#8ab4f8]/10 text-[#8ab4f8]">
            <Grid2X2 size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Default Gallery Grid Size
            </h2>
            <p className="text-xs text-zinc-400">
              Select your preferred photo tile density across Photos, Folder, and Albums.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
          {[
            {
              id: "small" as GridSize,
              label: "Small",
              desc: "Compact view (6–8 columns)",
              iconStyle: "grid grid-cols-4 gap-1 p-2",
              boxes: 8,
            },
            {
              id: "medium" as GridSize,
              label: "Medium (Recommended)",
              desc: "Standard balanced view (4–6 columns)",
              iconStyle: "grid grid-cols-3 gap-1.5 p-2",
              boxes: 6,
            },
            {
              id: "large" as GridSize,
              label: "Large",
              desc: "Spacious preview view (2–4 columns)",
              iconStyle: "grid grid-cols-2 gap-2 p-2",
              boxes: 4,
            },
          ].map((item) => {
            const isSelected = currentGridSize === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectGridSize(item.id)}
                className={`flex flex-col text-left rounded-2xl border p-4 transition cursor-pointer ${
                  isSelected
                    ? "border-[#8ab4f8] bg-[#8ab4f8]/10 shadow-sm"
                    : "border-[#262626] bg-[#1c1c1c] hover:border-zinc-700"
                }`}
              >
                <div
                  className={`h-20 w-full rounded-xl bg-[#141414] border border-[#262626] mb-3.5 flex items-center justify-center ${item.iconStyle}`}
                >
                  {Array.from({ length: item.boxes }).map((_, i) => (
                    <div
                      key={i}
                      className={`size-full rounded ${
                        isSelected ? "bg-[#8ab4f8]/40" : "bg-zinc-700/40"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-100">
                    {item.label}
                  </span>
                  {isSelected && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#8ab4f8] text-zinc-950">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className="mt-1 text-xs text-zinc-400">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sort Order Preference */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <ArrowDownAZ size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Default Sort Order
            </h2>
            <p className="text-xs text-zinc-400">
              Initial sorting applied when viewing directories and albums.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
          {[
            {
              id: "modified-desc" as GallerySort,
              title: "Latest First",
              desc: "Most recently updated photos first",
            },
            {
              id: "name-asc" as GallerySort,
              title: "Name (A → Z)",
              desc: "Alphabetical ascending order",
            },
            {
              id: "name-desc" as GallerySort,
              title: "Name (Z → A)",
              desc: "Alphabetical descending order",
            },
          ].map((opt) => {
            const isSelected = currentSort === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectSort(opt.id)}
                className={`flex flex-col text-left rounded-2xl border p-4 transition cursor-pointer ${
                  isSelected
                    ? "border-purple-400/80 bg-purple-500/10 shadow-sm"
                    : "border-[#262626] bg-[#1c1c1c] hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-100">
                    {opt.title}
                  </span>
                  {isSelected && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-purple-400 text-zinc-950">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className="mt-1 text-xs text-zinc-400">
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Reset Preferences & Browser Storage */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">
              Reset Client Preferences
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Clears local preferences (grid sizes, sort order, and active selected library) from browser storage.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetPreferences}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#262626] hover:text-white cursor-pointer sm:self-auto"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
        </div>
      </section>

      {/* Thumbnail Cache Management */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Thumbnail Cache Storage
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                Pre-rendered WebP thumbnails stored on server disk for fast justified browsing.
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-xs">
                {loadingCacheStats ? (
                  <span className="inline-flex items-center gap-1.5 text-zinc-500">
                    <Loader2 size={12} className="animate-spin" />
                    Calculating cache size...
                  </span>
                ) : (
                  <span className="font-semibold text-zinc-200">
                    {formatBytes(cacheStats?.totalSizeBytes ?? 0)}{" "}
                    <span className="font-normal text-zinc-400">
                      ({(cacheStats?.thumbnailCount ?? 0).toLocaleString()} cached thumbnails)
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={purgingCache || (cacheStats?.thumbnailCount ?? 0) === 0}
            onClick={() => setConfirmPurgeOpen(true)}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300 disabled:opacity-50 cursor-pointer sm:self-auto"
          >
            {purgingCache ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Purge Thumbnail Cache
          </button>
        </div>
      </section>

      {/* Purge Cache Confirmation Modal */}
      {confirmPurgeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !purgingCache) {
              setConfirmPurgeOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#141414] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="purge-cache-title"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                <Trash2 size={20} />
              </div>
              <div>
                <h2
                  id="purge-cache-title"
                  className="text-base font-bold text-zinc-100"
                >
                  Clear Thumbnail Cache?
                </h2>
                <p className="text-xs text-zinc-400">
                  {formatBytes(cacheStats?.totalSizeBytes ?? 0)} across{" "}
                  {(cacheStats?.thumbnailCount ?? 0).toLocaleString()} files
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This will remove all generated WebP thumbnails from disk and flush memory. Original photos will <strong className="text-white">NOT</strong> be affected.
            </p>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Thumbnails will be automatically re-generated on-demand as you browse photos.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={purgingCache}
                onClick={() => setConfirmPurgeOpen(false)}
                className="rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-[#262626] hover:text-white transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purgingCache}
                onClick={handlePurgeCache}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-50 cursor-pointer"
              >
                {purgingCache ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Clear All Thumbnails
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System & Architecture Info */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Database size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              System Architecture & Database
            </h2>
            <p className="text-xs text-zinc-400">
              Directory-first SQLite photo gallery system.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-xl border border-[#262626] bg-[#1c1c1c] p-3.5">
            <span className="text-zinc-500 font-medium">Database Path</span>
            <p className="font-mono text-zinc-200 mt-1">data/gallery.sqlite</p>
          </div>
          <div className="rounded-xl border border-[#262626] bg-[#1c1c1c] p-3.5">
            <span className="text-zinc-500 font-medium">Thumbnail Cache</span>
            <p className="font-mono text-zinc-200 mt-1">data/thumbnails/ (Sharp WebP)</p>
          </div>
          <div className="rounded-xl border border-[#262626] bg-[#1c1c1c] p-3.5">
            <span className="text-zinc-500 font-medium">UI Theme</span>
            <p className="text-zinc-200 mt-1">Immich Dark Media Theme</p>
          </div>
          <div className="rounded-xl border border-[#262626] bg-[#1c1c1c] p-3.5">
            <span className="text-zinc-500 font-medium">Version</span>
            <p className="text-zinc-200 mt-1">Private Gallery v1.0.0</p>
          </div>
        </div>
      </section>
    </div>
  );
}
