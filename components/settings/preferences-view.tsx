"use client";

import {
  ArrowDownAZ,
  Check,
  CheckCircle2,
  Database,
  Grid2X2,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { useAppSettings } from "@/components/layout/settings-context";
import {
  type GallerySort,
  type GridSize,
} from "@/components/gallery/grid-controls";

export function PreferencesView() {
  const { settings, updateSetting, updateSettings } = useAppSettings();
  const currentGridSize = settings.defaultGridSize;
  const currentSort = settings.defaultSort;
  const [prefNotice, setPrefNotice] = useState("");

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
              Select your preferred photo tile density across Timeline, Folder, and Albums.
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
