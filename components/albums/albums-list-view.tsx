"use client";

import { useEffect, useState } from "react";
import { FolderArchive, Loader2, Plus } from "lucide-react";
import {
  AlbumCard,
  type GalleryAlbum,
} from "@/components/gallery/album-card";
import {
  getGridClasses,
  type GallerySort,
  type GridSize,
} from "@/components/gallery/grid-controls";
import { ConfirmDialog } from "@/components/gallery/confirm-dialog";
import { CreateAlbumModal } from "./create-album-modal";

interface AlbumsResponse {
  items: GalleryAlbum[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface AlbumsListViewProps {
  libraryId: number;
  sort: GallerySort;
  gridSize: GridSize;
}

export function AlbumsListView({
  libraryId,
  sort,
  gridSize,
}: AlbumsListViewProps) {
  const [albums, setAlbums] = useState<AlbumsResponse>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 36,
  });
  const [kindFilter, setKindFilter] = useState<"all" | "folder" | "custom">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<GalleryAlbum | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GalleryAlbum | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/albums?${new URLSearchParams({
        libraryId: String(libraryId),
        page: "1",
        sort,
        kind: kindFilter,
      })}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (res) => {
        const data = (await res.json()) as AlbumsResponse & { error?: string };
        if (!res.ok) throw new Error(data.error || "Failed to load albums.");
        setAlbums(data);
        setError("");
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load albums.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [libraryId, sort, kindFilter, refreshKey]);

  const handleRenameAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget?.id || !renameInput.trim()) return;
    setRenaming(true);

    try {
      const res = await fetch("/api/albums", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId: renameTarget.id,
          name: renameInput.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to rename album.");

      setRenameTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename album.");
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/albums?albumId=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete album.");
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete album.");
    } finally {
      setDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Top Header & Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
            Albums
          </h1>
          <p className="text-xs text-zinc-400">
            {albums.totalCount} albums in library
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center rounded-xl border border-[#262626] bg-[#141414] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setKindFilter("all")}
              className={`rounded-lg px-3 py-1 transition cursor-pointer ${
                kindFilter === "all"
                  ? "bg-[#8ab4f8] text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("folder")}
              className={`rounded-lg px-3 py-1 transition cursor-pointer ${
                kindFilter === "folder"
                  ? "bg-[#8ab4f8] text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Folders
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("custom")}
              className={`rounded-lg px-3 py-1 transition cursor-pointer ${
                kindFilter === "custom"
                  ? "bg-[#8ab4f8] text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Virtual
            </button>
          </div>

          {/* Create Album Button */}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#8ab4f8] px-3.5 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm transition hover:bg-[#aecbfa] cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Album</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-[#8ab4f8]" />
        </div>
      ) : albums.items.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-[#1c1c1c] text-zinc-500">
            <FolderArchive size={32} />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-100">
            No Albums Found
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Create a new virtual album or scan directories in your library.
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#8ab4f8] px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm transition hover:bg-[#aecbfa] cursor-pointer"
          >
            <Plus size={15} />
            <span>Create New Album</span>
          </button>
        </div>
      ) : (
        <div className={getGridClasses(gridSize)}>
          {albums.items.map((album) => (
            <AlbumCard
              key={album.path || album.id}
              album={album}
              libraryId={libraryId}
              onRename={(alb) => {
                setRenameTarget(alb);
                setRenameInput(alb.name);
              }}
              onDelete={album.kind === "custom" ? (alb) => setDeleteTarget(alb) : undefined}
            />
          ))}
        </div>
      )}

      {/* Create Album Modal */}
      <CreateAlbumModal
        open={createModalOpen}
        libraryId={libraryId}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
        onError={(err) => setError(err)}
      />

      {/* Rename Album Modal */}
      {renameTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#2e2e2e] bg-[#141414] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-zinc-100">Rename Album</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Change the display title of this album.
            </p>

            <form onSubmit={handleRenameAlbum} className="mt-4">
              <input
                type="text"
                autoFocus
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                placeholder="Album title"
                className="w-full rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] px-3.5 py-2.5 text-xs font-medium text-zinc-100 outline-none transition focus:border-[#8ab4f8] focus:bg-[#212121]"
              />

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={renaming}
                  onClick={() => setRenameTarget(null)}
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-[#212121] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renaming || !renameInput.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#8ab4f8] px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm transition hover:bg-[#aecbfa] disabled:opacity-50 cursor-pointer"
                >
                  {renaming && <Loader2 size={13} className="animate-spin text-zinc-950" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Album Confirm Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will remove this virtual album. Your original photo files will NOT be deleted from your disk."
        confirmLabel="Delete Album"
        isDestructive
        loading={deleting}
        onConfirm={handleDeleteAlbum}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
