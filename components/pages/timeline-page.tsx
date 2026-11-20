"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FolderArchive, FolderPlus, Heart, Image as ImageIcon, Loader2, Tag, X } from "lucide-react";
import { useLibrary } from "@/components/layout/library-context";
import { GalleryHeader } from "@/components/layout/gallery-header";
import { PhotoCard } from "@/components/gallery/photo-card";
import { AddToAlbumModal } from "@/components/gallery/add-to-album-modal";
import { AddTagModal } from "@/components/gallery/add-tag-modal";
import {
  LightboxModal,
  type GalleryPhoto,
} from "@/components/gallery/lightbox-modal";

interface TimelineResponse {
  items: GalleryPhoto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

function dateKey(photo: GalleryPhoto) {
  return photo.modifiedAt?.slice(0, 10) ?? "unknown";
}

function dateLabel(key: string) {
  if (key === "unknown") return "Unknown date";
  const date = new Date(`${key}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function TimelineList({
  libraryId,
  libraryName,
  externalSelectedPhoto,
  onClearExternalPhoto,
}: {
  libraryId: number;
  libraryName?: string;
  externalSelectedPhoto: GalleryPhoto | null;
  onClearExternalPhoto: () => void;
}) {
  const [timeline, setTimeline] = useState<TimelineResponse>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 24,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [localSelectedPhoto, setLocalSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    isFetchingRef.current = loading || loadingMore;
  }, [loading, loadingMore]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `/api/timeline?${new URLSearchParams({
        libraryId: String(libraryId),
        page: String(page),
        q: "",
      })}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        const data = (await response.json()) as TimelineResponse | { error?: string };
        if (!response.ok) {
          throw new Error("error" in data && data.error ? data.error : "Failed to load timeline.");
        }
        const result = data as TimelineResponse;
        setError("");
        setTimeline((current) => {
          if (page === 1) {
            return result;
          }
          const existingPaths = new Set(current.items.map((item) => item.path));
          const newItems = result.items.filter((item) => !existingPaths.has(item.path));
          return {
            ...result,
            items: [...current.items, ...newItems],
          };
        });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Failed to load timeline.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          isFetchingRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      });

    return () => controller.abort();
  }, [libraryId, page]);

  const groups = useMemo(() => {
    const grouped = new Map<string, GalleryPhoto[]>();
    const seen = new Set<string>();
    for (const photo of timeline.items) {
      if (seen.has(photo.path)) continue;
      seen.add(photo.path);
      const key = dateKey(photo);
      const items = grouped.get(key) ?? [];
      items.push(photo);
      grouped.set(key, items);
    }
    return [...grouped.entries()];
  }, [timeline.items]);

  const hasMore = timeline.page * timeline.pageSize < timeline.totalCount;

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

  const toggleSelectPhoto = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const activePhoto = externalSelectedPhoto ?? localSelectedPhoto;

  const handleCloseLightbox = () => {
    setLocalSelectedPhoto(null);
    onClearExternalPhoto();
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
      setTimeline((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          selectedPaths.has(item.path) ? { ...item, isFavorite: true } : item,
        ),
      }));
      setNotice(`Added ${paths.length} photo(s) to Favorites.`);
      setSelectedPaths(new Set());
    } catch {
      // ignore
    }
  };

  if (error) {
    return (
      <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
        {error}
      </div>
    );
  }

  if (loading && page === 1) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#8ab4f8]" />
      </div>
    );
  }

  if (timeline.items.length === 0) {
    return (
      <div className="mx-auto mt-16 max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-zinc-200/60 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
          <ImageIcon size={32} />
        </div>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          No Indexed Photos Yet
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Folder &ldquo;{libraryName}&rdquo; has no photos indexed into the database yet.
        </p>
        <Link
          href="/settings"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Run Library Scan
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {groups.map(([dateKeyString, photos]) => (
          <section key={dateKeyString}>
            <div className="sticky top-16 z-10 -mx-4 mb-3.5 flex items-center justify-between bg-black/90 px-4 py-2.5 backdrop-blur-md sm:-mx-8 sm:px-8">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold tracking-tight text-zinc-200">
                  {dateLabel(dateKeyString)}
                </h2>
                <span className="rounded-full border border-[#2e2e2e] bg-[#1e1e1e] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                  {photos.length} {photos.length === 1 ? "photo" : "photos"}
                </span>
              </div>
            </div>

            <div className="columns-2 gap-2.5 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6">
              {photos.map((photo, index) => (
                <PhotoCard
                  key={photo.path}
                  photo={photo}
                  libraryId={libraryId}
                  aspectRatio="natural"
                  eager={index < 8}
                  selectable
                  selected={selectedPaths.has(photo.path)}
                  onToggleSelect={() => toggleSelectPhoto(photo.path)}
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
          </section>
        ))}

        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {loadingMore && <Loader2 className="size-6 animate-spin text-[#8ab4f8]" />}
        </div>
      </div>

      {/* Notice Banner */}
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

      {/* Floating Action Bar (When items are selected) */}
      {selectedPaths.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-[#2e2e2e] bg-[#141414]/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 border-r border-[#262626] pr-3 text-xs font-bold text-zinc-100">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#8ab4f8] text-[10px] font-bold text-zinc-950">
              {selectedPaths.size}
            </span>
            <span>Selected</span>
          </div>

          <button
            type="button"
            onClick={handleBatchFavorite}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
          >
            <Heart size={14} className="text-rose-400" />
            <span>Favorite</span>
          </button>

          <button
            type="button"
            onClick={() => setAddToAlbumOpen(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
          >
            <FolderArchive size={14} className="text-[#8ab4f8]" />
            <span>Add to Album</span>
          </button>

          <button
            type="button"
            onClick={() => setAddTagOpen(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
          >
            <Tag size={14} className="text-[#8ab4f8]" />
            <span>Tag</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPaths(new Set())}
            title="Deselect all"
            className="ml-1 rounded-xl p-1.5 text-zinc-400 transition hover:bg-[#212121] hover:text-zinc-200 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

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

      <LightboxModal
        photo={activePhoto}
        items={timeline.items}
        libraryId={libraryId}
        onClose={handleCloseLightbox}
        onNavigate={setLocalSelectedPhoto}
      />
    </>
  );
}

export function TimelineView() {
  const { selectedLibraryId, selectedLibrary, loading: libraryLoading } = useLibrary();
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const handleSelectPhoto = useCallback((photo: GalleryPhoto) => {
    setSelectedPhoto(photo);
  }, []);

  const handleClearPhoto = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  return (
    <div>
      <GalleryHeader onSelectPhoto={handleSelectPhoto} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        {libraryLoading && (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#8ab4f8]" />
          </div>
        )}

        {!libraryLoading && selectedLibraryId === null && (
          <div className="mx-auto mt-16 max-w-md text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-[#8ab4f8]/10 text-[#8ab4f8]">
              <FolderPlus size={32} />
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-100">
              No Libraries Configured
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Add a media directory in Settings to start indexing and browsing your gallery.
            </p>
            <Link
              href="/settings"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#8ab4f8] px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-[#aecbfa]"
            >
              <FolderPlus size={16} />
              Setup First Library
            </Link>
          </div>
        )}

        {!libraryLoading && selectedLibraryId !== null && (
          <TimelineList
            key={selectedLibraryId}
            libraryId={selectedLibraryId}
            libraryName={selectedLibrary?.name}
            externalSelectedPhoto={selectedPhoto}
            onClearExternalPhoto={handleClearPhoto}
          />
        )}
      </div>
    </div>
  );
}
