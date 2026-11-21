"use client";

import {
  Copy,
  FolderArchive,
  FolderInput,
  Heart,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";

interface ExploreActionBarProps {
  selectedCount: number;
  onFavorite: () => void;
  onCopy: () => void;
  onMove: () => void;
  onAddToAlbum: () => void;
  onTag: () => void;
  onPerson?: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function ExploreActionBar({
  selectedCount,
  onFavorite,
  onCopy,
  onMove,
  onAddToAlbum,
  onTag,
  onPerson,
  onDelete,
  onClear,
}: ExploreActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-[#2e2e2e] bg-[#141414]/95 px-4 py-2.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center gap-2 border-r border-[#262626] pr-3 text-xs font-bold text-zinc-100">
        <span className="flex size-5 items-center justify-center rounded-full bg-[#8ab4f8] text-[10px] font-bold text-zinc-950">
          {selectedCount}
        </span>
        <span>Selected</span>
      </div>

      <button
        type="button"
        onClick={onFavorite}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
      >
        <Heart size={14} className="text-rose-400" />
        <span>Favorite</span>
      </button>

      <button
        type="button"
        onClick={onCopy}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
      >
        <Copy size={14} className="text-[#8ab4f8]" />
        <span>Copy</span>
      </button>

      <button
        type="button"
        onClick={onMove}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
      >
        <FolderInput size={14} className="text-[#8ab4f8]" />
        <span>Move</span>
      </button>

      <button
        type="button"
        onClick={onAddToAlbum}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
      >
        <FolderArchive size={14} className="text-[#8ab4f8]" />
        <span>Add to Album</span>
      </button>

      <button
        type="button"
        onClick={onTag}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer"
      >
        <Tag size={14} className="text-[#8ab4f8]" />
        <span>Tag</span>
      </button>

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

      <button
        type="button"
        onClick={onDelete}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 cursor-pointer"
      >
        <Trash2 size={14} />
        <span>Delete</span>
      </button>

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
