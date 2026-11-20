"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PhotoCard } from "@/components/gallery/photo-card";
import {
  GridControls,
  type GallerySort,
  type GridSize,
} from "@/components/gallery/grid-controls";
import {
  LightboxModal,
  type GalleryPhoto,
} from "@/components/gallery/lightbox-modal";
import { AddToAlbumModal } from "@/components/gallery/add-to-album-modal";
import { AddTagModal } from "@/components/gallery/add-tag-modal";
import { ConfirmDialog } from "@/components/gallery/confirm-dialog";
import { FolderPickerModal } from "@/components/gallery/folder-picker-modal";
import { ExploreActionBar } from "./explore-action-bar";

function getMasonryClasses(size: GridSize) {
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

interface FilteredPhotosResponse {
  filterLabel: string;
  items: (GalleryPhoto & { isFavorite?: boolean })[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface ExploreFilteredViewProps {
  libraryId: number;
  gridSize: GridSize;
  onGridSizeChange: (size: GridSize) => void;
  sort: GallerySort;
  onSortChange: (sort: GallerySort) => void;
  collectionParam: string | null;
  tagParam: string | null;
  cameraParam: string | null;
  yearParam: string | null;
  onNotice: (msg: string) => void;
}

export function ExploreFilteredView({
  libraryId,
  gridSize,
  onGridSizeChange,
  sort,
  onSortChange,
  collectionParam,
  tagParam,
  cameraParam,
  yearParam,
  onNotice,
}: ExploreFilteredViewProps) {
  const router = useRouter();

  const [photosData, setPhotosData] = useState<FilteredPhotosResponse>({
    filterLabel: "Explore",
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 48,
  });
  const [photosLoading, setPhotosLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [photosError, setPhotosError] = useState("");

  // Selection & Actions
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [folderPickerAction, setFolderPickerAction] = useState<"copy" | "move" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch Filtered Photos
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setPhotosLoading(true);
        setSelectedPaths(new Set());
      }
    });

    const params = new URLSearchParams({
      libraryId: String(libraryId),
      page: "1",
      pageSize: "48",
    });

    if (collectionParam) params.set("collection", collectionParam);
    if (tagParam) params.set("tag", tagParam);
    if (cameraParam) params.set("camera", cameraParam);
    if (yearParam) params.set("year", yearParam);

    fetch(`/api/explore?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load photos.");
        return res.json();
      })
      .then((data: FilteredPhotosResponse) => {
        if (active) {
          setPhotosData(data);
          setHasMore(data.items.length < data.totalCount);
          setPhotosError("");
          setPhotosLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setPhotosError(err instanceof Error ? err.message : "Error loading photos");
          setPhotosLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [libraryId, collectionParam, tagParam, cameraParam, yearParam]);

  // Infinite scroll loader
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = photosData.page + 1;
    const params = new URLSearchParams({
      libraryId: String(libraryId),
      page: String(nextPage),
      pageSize: "48",
    });

    if (collectionParam) params.set("collection", collectionParam);
    if (tagParam) params.set("tag", tagParam);
    if (cameraParam) params.set("camera", cameraParam);
    if (yearParam) params.set("year", yearParam);

    try {
      const res = await fetch(`/api/explore?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load more photos.");
      const data = (await res.json()) as FilteredPhotosResponse;

      setPhotosData((prev) => ({
        ...prev,
        page: nextPage,
        items: [...prev.items, ...data.items],
      }));
      setHasMore(photosData.items.length + data.items.length < photosData.totalCount);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [
    libraryId,
    loadingMore,
    hasMore,
    photosData.page,
    photosData.items.length,
    photosData.totalCount,
    collectionParam,
    tagParam,
    cameraParam,
    yearParam,
  ]);

  useEffect(() => {
    if (!hasMore || photosLoading || loadingMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "600px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, photosLoading, loadingMore, loadMore]);

  // Selection toggle
  const toggleSelect = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // Batch Favorite handler
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
      setPhotosData((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          paths.includes(item.path) ? { ...item, isFavorite: true } : item,
        ),
      }));
      onNotice(`Added ${paths.length} photo(s) to Favorites.`);
      setSelectedPaths(new Set());
    } catch {
      // ignore
    }
  };

  // Execute Copy, Move, Delete actions
  const executeAction = async (action: "delete" | "move" | "copy", destinationFolder?: string) => {
    if (selectedPaths.size === 0) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/gallery/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libraryId,
          action,
          paths: Array.from(selectedPaths),
          destinationFolder,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${action} items.`);
      }

      onNotice(`Successfully ${action}d ${selectedPaths.size} photo(s).`);
      setSelectedPaths(new Set());
      setConfirmDeleteOpen(false);
      setFolderPickerAction(null);

      // Refresh filtered photos
      setPhotosData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => !selectedPaths.has(item.path)),
        totalCount: Math.max(0, prev.totalCount - selectedPaths.size),
      }));
    } catch (err) {
      onNotice(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#262626] bg-[#141414]/80 p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/explore")}
            className="flex items-center gap-1.5 rounded-xl border border-[#2e2e2e] bg-[#1e1e1e] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#282828] hover:text-zinc-100 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>All Explore</span>
          </button>

          <div className="h-4 w-px bg-[#2e2e2e]" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-100">
              {photosData.filterLabel}
            </span>
            <span className="rounded-full bg-[#262626] px-2 py-0.5 text-[11px] font-medium text-zinc-400">
              {photosData.totalCount} photo
              {photosData.totalCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <GridControls
          gridSize={gridSize}
          onGridSizeChange={onGridSizeChange}
          sort={sort}
          onSortChange={onSortChange}
        />
      </div>

      {/* Photos Grid */}
      {photosLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="size-8 animate-spin text-[#8ab4f8] mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading photos...</p>
        </div>
      ) : photosError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400">
          {photosError}
        </div>
      ) : photosData.items.length > 0 ? (
        <>
          <div className={getMasonryClasses(gridSize)}>
            {photosData.items.map((photo, index) => (
              <PhotoCard
                key={photo.path}
                photo={photo}
                libraryId={libraryId}
                aspectRatio="natural"
                eager={index < 8}
                selectable
                selected={selectedPaths.has(photo.path)}
                onToggleSelect={() => toggleSelect(photo.path)}
                onToggleFavorite={(p, isFav) => {
                  setPhotosData((prev) => ({
                    ...prev,
                    items: prev.items.map((item) =>
                      item.path === p.path ? { ...item, isFavorite: isFav } : item,
                    ),
                  }));
                }}
                onSelect={(p) => {
                  if (selectedPaths.size > 0) {
                    toggleSelect(p.path);
                  } else {
                    setSelectedPhoto(p);
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
        <div className="py-24 text-center text-sm text-zinc-500">
          No photos found in this collection.
        </div>
      )}

      {/* Floating Action Bar (Multi-Select) */}
      <ExploreActionBar
        selectedCount={selectedPaths.size}
        onFavorite={handleBatchFavorite}
        onCopy={() => setFolderPickerAction("copy")}
        onMove={() => setFolderPickerAction("move")}
        onAddToAlbum={() => setAddToAlbumOpen(true)}
        onTag={() => setAddTagOpen(true)}
        onDelete={() => setConfirmDeleteOpen(true)}
        onClear={() => setSelectedPaths(new Set())}
      />

      {/* Lightbox Modal */}
      <LightboxModal
        photo={selectedPhoto}
        items={photosData.items}
        libraryId={libraryId}
        onClose={() => setSelectedPhoto(null)}
        onNavigate={setSelectedPhoto}
      />

      {/* Add To Album Dialog */}
      <AddToAlbumModal
        open={addToAlbumOpen}
        libraryId={libraryId}
        photoPaths={Array.from(selectedPaths)}
        onClose={() => setAddToAlbumOpen(false)}
        onSuccess={(albumName) => {
          onNotice(`Added ${selectedPaths.size} photo(s) to "${albumName}".`);
          setSelectedPaths(new Set());
        }}
      />

      {/* Add Tag Dialog */}
      <AddTagModal
        isOpen={addTagOpen}
        libraryId={libraryId}
        entryPaths={Array.from(selectedPaths)}
        onClose={() => setAddTagOpen(false)}
        onSuccess={(tagName) => {
          onNotice(`Tagged ${selectedPaths.size} photo(s) with #${tagName}.`);
          setSelectedPaths(new Set());
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title={`Delete ${selectedPaths.size} Photo(s)?`}
        description="The selected photos will be permanently removed from disk. This cannot be undone."
        confirmLabel="Delete Permanently"
        isDestructive
        loading={actionLoading}
        onConfirm={() => executeAction("delete")}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      {/* Folder Picker Modal (Move / Copy) */}
      <FolderPickerModal
        open={folderPickerAction !== null}
        libraryId={libraryId}
        action={folderPickerAction ?? "move"}
        selectedCount={selectedPaths.size}
        currentFolder=""
        loading={actionLoading}
        onConfirm={(target) => executeAction(folderPickerAction!, target)}
        onCancel={() => setFolderPickerAction(null)}
      />
    </div>
  );
}
