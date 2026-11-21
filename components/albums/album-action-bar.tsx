"use client";

import {
  FolderArchive,
  Heart,
  Loader2,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";

interface AlbumActionBarProps {
  selectedCount: number;
  isAllSelected?: boolean;
  actionLoading?: boolean;
  onToggleSelectAll?: () => void;
  onFavorite: () => void;
  onAddToAlbum?: () => void;
  onTag?: () => void;
  onPerson?: () => void;
  onRemoveFromAlbum?: () => void;
  onClear: () => void;
}

export function AlbumActionBar({
  selectedCount,
  isAllSelected = false,
  actionLoading = false,
  onToggleSelectAll,
  onFavorite,
  onAddToAlbum,
  onTag,
  onPerson,
  onRemoveFromAlbum,
  onClear,
}: AlbumActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-[#2e2e2e] bg-[#141414]/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center gap-2 border-r border-[#262626] pr-3 text-xs font-bold text-zinc-100">
        <span className="flex size-5 items-center justify-center rounded-full bg-[#8ab4f8] text-[10px] font-bold text-zinc-950">
          {selectedCount}
        </span>
        <span>Selected</span>
        {onToggleSelectAll && (
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="ml-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-[#8ab4f8] transition hover:bg-[#8ab4f8]/10 cursor-pointer"
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onFavorite}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
      >
        <Heart size={14} className="text-rose-400" />
        <span>Favorite</span>
      </button>

      {onAddToAlbum && (
        <button
          type="button"
          onClick={onAddToAlbum}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
        >
          <FolderArchive size={14} className="text-[#8ab4f8]" />
          <span>Add to Album</span>
        </button>
      )}

      {onTag && (
        <button
          type="button"
          onClick={onTag}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
        >
          <Tag size={14} className="text-[#8ab4f8]" />
          <span>Tag</span>
        </button>
      )}

      {onPerson && (
        <button
          type="button"
          onClick={onPerson}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
        >
          <Users size={14} className="text-[#8ab4f8]" />
          <span>Person</span>
        </button>
      )}

      {onRemoveFromAlbum && (
        <button
          type="button"
          disabled={actionLoading}
          onClick={onRemoveFromAlbum}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 cursor-pointer disabled:opacity-50"
        >
          {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          <span>Remove from Album</span>
        </button>
      )}

      <button
        type="button"
        onClick={onClear}
        title="Deselect all"
        className="ml-1 rounded-xl p-1.5 text-zinc-400 transition hover:bg-[#212121] hover:text-zinc-200 cursor-pointer"
      >
        <X size={15} />
      </button>
    </div>
  );
}
