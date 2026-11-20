"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, Folder } from "lucide-react";
import { galleryImageUrl } from "@/lib/gallery-image-url";

interface FolderItemData {
  name: string;
  path: string;
  coverPath?: string;
  coverUpdatedAt?: string;
  coverSize?: number;
}

interface FolderGridItemProps {
  folder: FolderItemData;
  libraryId: number;
  isSelected: boolean;
  hasSelection: boolean;
  onToggleSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function FolderGridItem({
  folder,
  libraryId,
  isSelected,
  hasSelection,
  onToggleSelect,
  onContextMenu,
}: FolderGridItemProps) {
  return (
    <div
      onContextMenu={onContextMenu}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-[#141414] aspect-square transition-all duration-200 ${
        isSelected
          ? "border-[#8ab4f8] ring-4 ring-[#8ab4f8]/20 shadow-md"
          : "border-[#262626] hover:-translate-y-0.5 hover:border-[#8ab4f8]/50 hover:shadow-xl hover:shadow-black/70"
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        title={isSelected ? "Deselect folder" : "Select folder"}
        className={`absolute top-2.5 left-2.5 z-20 flex size-6 items-center justify-center rounded-full transition-all cursor-pointer ${
          isSelected
            ? "bg-[#8ab4f8] text-zinc-950 shadow-md shadow-[#8ab4f8]/30 opacity-100"
            : "bg-black/60 text-white/90 backdrop-blur hover:bg-black/90 opacity-0 group-hover:opacity-100"
        }`}
      >
        {isSelected && <Check size={14} strokeWidth={3} />}
      </button>

      <Link
        href={`/folder?path=${encodeURIComponent(folder.path)}`}
        onClick={(e) => {
          if (hasSelection) {
            e.preventDefault();
            onToggleSelect();
          }
        }}
        className="relative block h-full w-full overflow-hidden"
      >
        {/* Folder Cover or Placeholder */}
        {folder.coverPath ? (
          <Image
            src={galleryImageUrl(
              folder.coverPath,
              libraryId,
              folder.coverUpdatedAt,
              folder.coverSize,
              360,
            )}
            alt={folder.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-[#8ab4f8] bg-[#181818]">
            <Folder size={44} className="fill-[#8ab4f8]/10" />
          </div>
        )}

        {/* Bottom Gradient Overlay & Name */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-8">
          <div className="flex items-center gap-1.5 truncate">
            <Folder size={14} className="text-[#8ab4f8] shrink-0 fill-[#8ab4f8]/30" />
            <span className="truncate text-xs font-semibold text-zinc-100 group-hover:text-[#8ab4f8] transition">
              {folder.name}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
