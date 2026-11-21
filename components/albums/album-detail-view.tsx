"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { PhotoCard } from "@/components/gallery/photo-card";
import { type GridSize } from "@/components/gallery/grid-controls";
import {
  LightboxModal,
  type GalleryPhoto,
} from "@/components/gallery/lightbox-modal";
import { ConfirmDialog } from "@/components/gallery/confirm-dialog";
import { AddToAlbumModal } from "@/components/gallery/add-to-album-modal";
import { AddTagModal } from "@/components/gallery/add-tag-modal";
import { AddPersonModal } from "@/components/gallery/add-person-modal";
import { AlbumActionBar } from "./album-action-bar";

interface AlbumPhotosResponse {
  album: string;
  path: string;
  albumId?: number;
  kind?: "folder" | "custom";
  description?: string | null;
  items: GalleryPhoto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function getAlbumMasonryClasses(size: GridSize) {
  switch (size) {
    case "small":
      return "columns-3 gap-2 sm:columns-4 md:columns-6 lg:columns-8";
    case "large":
      return "columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4";
    case "medium":
    default:
      return "columns-2 gap-2.5 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6";
  }
}

interface AlbumDetailViewProps {
  albumPath: string;
  libraryId: number;
  gridSize: GridSize;
  sort: string;
  externalSelectedPhoto: GalleryPhoto | null;
  onClearExternalPhoto: () => void;
}

export function AlbumDetailView({
  albumPath,
  libraryId,
  gridSize,
  sort,
  externalSelectedPhoto,
  onClearExternalPhoto,
}: AlbumDetailViewProps) {
  const router = useRouter();
  const [albumDetail, setAlbumDetail] = useState<AlbumPhotosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [localSelectedPhoto, setLocalSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Selection state for photos
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    isFetchingRef.current = loading || loadingMore;
  }, [loading, loadingMore]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/albums/photos?${new URLSearchParams({
        libraryId: String(libraryId),
        path: albumPath,
        page: String(page),
        sort,
      })}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (res) => {
        const data = (await res.json()) as AlbumPhotosResponse & { error?: string };
        if (!res.ok) throw new Error(data.error || "Failed to load album photos.");
        setAlbumDetail((current) => {
          if (page === 1 || !current) return data;
          const existingPaths = new Set(current.items.map((item) => item.path));
          const newItems = data.items.filter((item) => !existingPaths.has(item.path));
          return {
            ...data,
            items: [...current.items, ...newItems],
          };
        });
        setError("");
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load album photos.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          isFetchingRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      });

    return () => controller.abort();
  }, [albumPath, libraryId, page, refreshKey, sort]);

  const hasMore = albumDetail
    ? albumDetail.page * albumDetail.pageSize < albumDetail.totalCount
    : false;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore || error) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || isFetchingRef.current) return;
        isFetchingRef.current = true;
        setLoadingMore(true);
        setPage((current) => current + 1);
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, loading, loadingMore]);

  const handleCloseLightbox = () => {
    setLocalSelectedPhoto(null);
    onClearExternalPhoto();
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumDetail?.albumId || !renameInput.trim()) return;
    setRenaming(true);

    try {
      const res = await fetch("/api/albums", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId: albumDetail.albumId,
          name: renameInput.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to rename album.");

      setAlbumDetail((curr) => curr ? { ...curr, album: renameInput.trim() } : null);
      setRenameModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename album.");
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!albumDetail?.albumId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/albums?albumId=${albumDetail.albumId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete album.");
      router.push("/albums");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete album.");
      setDeleting(false);
    }
  };

  const handleRemoveFromAlbum = async () => {
    if (!albumDetail?.albumId || selectedPaths.size === 0) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove-photos",
          albumId: albumDetail.albumId,
          paths: Array.from(selectedPaths),
        }),
      });

      if (!res.ok) throw new Error("Failed to remove photos from album.");
      setSelectedPaths(new Set());
      setPage(1);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove photos.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchFavorite = async () => {
    if (selectedPaths.size === 0) return;
    const paths = Array.from(selectedPaths);
    try {
      await fetch("/api/gallery/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libraryId,
          entryPaths: paths,
          isFavorite: true,
        }),
      });
      setAlbumDetail((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) =>
                paths.includes(item.path) ? { ...item, isFavorite: true } : item,
              ),
            }
          : prev,
      );
      setSelectedPaths(new Set());
    } catch {
      // ignore
    }
  };

  const allItemPaths = useMemo(
    () => albumDetail?.items.map((i) => i.path) ?? [],
    [albumDetail?.items],
  );
  const isAllSelected =
    allItemPaths.length > 0 && selectedPaths.size === allItemPaths.length;

  const toggleSelectPhoto = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(allItemPaths));
    }
  }, [allItemPaths, isAllSelected]);

  // Keyboard shortcut Ctrl+A / Cmd+A
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setSelectedPaths(new Set(allItemPaths));
      } else if (e.key === "Escape") {
        if (selectedPaths.size > 0) {
          setSelectedPaths(new Set());
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allItemPaths, selectedPaths.size]);

  const activePhoto = externalSelectedPhoto ?? localSelectedPhoto;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#8ab4f8]" />
      </div>
    );
  }

  const albumTitle =
    albumDetail?.album ??
    albumPath.split("/").filter(Boolean).pop() ??
    "Album";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/albums"
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-[#1c1c1c] hover:text-zinc-200 cursor-pointer"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
                {albumTitle}
              </h1>
              {albumDetail?.albumId && (
                <button
                  type="button"
                  title="Rename Album"
                  onClick={() => {
                    setRenameInput(albumTitle);
                    setRenameModalOpen(true);
                  }}
                  className="rounded-lg p-1 text-zinc-400 transition hover:bg-[#1c1c1c] hover:text-[#8ab4f8] cursor-pointer"
                >
                  <Pencil size={15} />
                </button>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
              <span>{albumDetail?.totalCount ?? 0} photos</span>
              {albumDetail?.kind === "custom" && (
                <>
                  <span>·</span>
                  <span className="text-[#8ab4f8] font-medium">Virtual Album</span>
                </>
              )}
              {albumDetail?.description && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-sm">{albumDetail.description}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {albumDetail?.kind === "custom" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete Album</span>
            </button>
          </div>
        )}
      </div>

      {notice && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-400">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {albumDetail?.items && albumDetail.items.length > 0 ? (
        <>
          <div className={getAlbumMasonryClasses(gridSize)}>
            {albumDetail.items.map((photo, index) => (
              <PhotoCard
                key={photo.path}
                photo={photo}
                libraryId={libraryId}
                aspectRatio="natural"
                eager={index < 8}
                selectable
                selected={selectedPaths.has(photo.path)}
                onToggleSelect={() => toggleSelectPhoto(photo.path)}
                onToggleFavorite={(p, isFav) => {
                  setAlbumDetail((prev) =>
                    prev
                      ? {
                          ...prev,
                          items: prev.items.map((item) =>
                            item.path === p.path
                              ? { ...item, isFavorite: isFav }
                              : item,
                          ),
                        }
                      : prev,
                  );
                }}
                onSelect={(p) => {
                  if (selectedPaths.size > 0) {
                    toggleSelectPhoto(p.path);
                  } else {
                    setLocalSelectedPhoto(p);
                  }
                }}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
            {loadingMore && <Loader2 className="size-6 animate-spin text-[#8ab4f8]" />}
          </div>
        </>
      ) : (
        <div className="py-20 text-center text-sm text-zinc-400">
          This album has no photos yet.
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedPaths.size > 0 && (
        <AlbumActionBar
          selectedCount={selectedPaths.size}
          isAllSelected={isAllSelected}
          actionLoading={actionLoading}
          onToggleSelectAll={toggleSelectAll}
          onFavorite={handleBatchFavorite}
          onAddToAlbum={() => setAddToAlbumOpen(true)}
          onTag={() => setAddTagOpen(true)}
          onPerson={() => setAddPersonOpen(true)}
          onRemoveFromAlbum={albumDetail?.kind === "custom" ? handleRemoveFromAlbum : undefined}
          onClear={() => setSelectedPaths(new Set())}
        />
      )}

      {/* Rename Album Modal */}
      {renameModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#2e2e2e] bg-[#141414] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-zinc-100">Rename Album</h3>
            <form onSubmit={handleRename} className="mt-4">
              <input
                type="text"
                autoFocus
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                placeholder="Album name"
                className="w-full rounded-xl border border-[#2e2e2e] bg-[#1c1c1c] px-3.5 py-2.5 text-xs font-medium text-zinc-100 outline-none transition focus:border-[#8ab4f8] focus:bg-[#212121]"
              />
              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={renaming}
                  onClick={() => setRenameModalOpen(false)}
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
        open={deleteConfirmOpen}
        title={`Delete "${albumTitle}"?`}
        description="This will permanently delete this virtual album. The photo files will NOT be deleted from your disk."
        confirmLabel="Delete Album"
        isDestructive
        loading={deleting}
        onConfirm={handleDeleteAlbum}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {/* Add to Album Modal */}
      <AddToAlbumModal
        open={addToAlbumOpen}
        libraryId={libraryId}
        photoPaths={Array.from(selectedPaths)}
        onClose={() => setAddToAlbumOpen(false)}
        onSuccess={(albumName) => {
          setNotice(`Added ${selectedPaths.size} photo(s) to "${albumName}".`);
          setSelectedPaths(new Set());
        }}
      />

      {/* Add Tag Modal */}
      <AddTagModal
        isOpen={addTagOpen}
        libraryId={libraryId}
        entryPaths={Array.from(selectedPaths)}
        onClose={() => setAddTagOpen(false)}
        onSuccess={(tagName, count) => {
          setNotice(`Added tag #${tagName} to ${count} photo(s).`);
          setSelectedPaths(new Set());
        }}
      />

      {/* Add Person Modal */}
      <AddPersonModal
        isOpen={addPersonOpen}
        libraryId={libraryId}
        entryPaths={Array.from(selectedPaths)}
        onClose={() => setAddPersonOpen(false)}
        onSuccess={(personName, count) => {
          setNotice(`Tagged ${personName} in ${count} photo(s).`);
          setSelectedPaths(new Set());
        }}
      />

      <LightboxModal
        photo={activePhoto}
        items={albumDetail?.items ?? []}
        libraryId={libraryId}
        onClose={handleCloseLightbox}
        onNavigate={setLocalSelectedPhoto}
      />
    </div>
  );
}
