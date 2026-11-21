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

interface FolderActionBarProps {
  selectedCount: number;
  isAdmin: boolean;
  hasDirectories?: boolean;
  isAllSelected?: boolean;
  onToggleSelectAll?: () => void;
  onCopy: () => void;
  onMove: () => void;
  onFavorite: () => void;
  onAddToAlbum: () => void;
  onTag: () => void;
  onPerson?: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function FolderActionBar({
  selectedCount,
  isAdmin,
  hasDirectories = false,
  isAllSelected = false,
  onToggleSelectAll,
  onCopy,
  onMove,
  onFavorite,
  onAddToAlbum,
  onTag,
  onPerson,
  onDelete,
  onClear,
}: FolderActionBarProps) {
  if (selectedCount === 0) return null;

  const disablePhotoActions = hasDirectories;
  const photoActionTooltip = hasDirectories
    ? "Action is disabled because one or more folders are selected. Select only photos to proceed."
    : undefined;

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

      {isAdmin && (
        <>
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
            disabled={disablePhotoActions}
            onClick={onFavorite}
            title={photoActionTooltip || "Favorite"}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Heart size={14} className="text-rose-400" />
            <span>Favorite</span>
          </button>

          <button
            type="button"
            disabled={disablePhotoActions}
            onClick={onAddToAlbum}
            title={photoActionTooltip || "Add to Album"}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <FolderArchive size={14} className="text-[#8ab4f8]" />
            <span>Add to Album</span>
          </button>

          <button
            type="button"
            disabled={disablePhotoActions}
            onClick={onTag}
            title={photoActionTooltip || "Tag"}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Tag size={14} className="text-[#8ab4f8]" />
            <span>Tag</span>
          </button>

          {onPerson && (
            <button
              type="button"
              disabled={disablePhotoActions}
              onClick={onPerson}
              title={photoActionTooltip || "Person"}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#212121] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
        </>
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
