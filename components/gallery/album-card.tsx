"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { galleryImageUrl } from "@/lib/gallery-image-url";
import { recordAlbumOpen } from "@/lib/album-recommendations";

export interface GalleryAlbum {
  id?: number;
  kind?: "folder" | "custom";
  name: string;
  path: string;
  description?: string | null;
  photoCount: number;
  coverPath: string;
  coverModifiedAt: string | null;
  coverSize: number | null;
  updatedAt: string | null;
}

interface AlbumCardProps {
  album: GalleryAlbum;
  libraryId: number;
  onRename?: (album: GalleryAlbum) => void;
  onDelete?: (album: GalleryAlbum) => void;
}

export function AlbumCard({
  album,
  libraryId,
  onRename,
  onDelete,
}: AlbumCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", handleClickOutside);
    return () => window.removeEventListener("pointerdown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#262626] bg-[#141414] transition-all duration-300 hover:-translate-y-1 hover:border-[#8ab4f8]/50 hover:shadow-2xl hover:shadow-black/80">
      <Link
        href={`/albums?path=${encodeURIComponent(album.path)}`}
        onClick={() => recordAlbumOpen(libraryId, album.path)}
        className="block relative aspect-[16/10] w-full overflow-hidden bg-[#1c1c1c]"
      >
        {/* Background Cover Image */}
        {album.coverPath ? (
          <Image
            src={galleryImageUrl(
              album.coverPath,
              libraryId,
              album.coverModifiedAt,
              album.coverSize,
              600,
            )}
            alt={album.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600 bg-gradient-to-br from-[#181818] to-[#121212]">
            <Folder size={44} />
          </div>
        )}

        {/* Cinematic Dark Overlay with subtle blur */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35 backdrop-blur-[1px] transition-opacity duration-300 group-hover:via-black/40" />

        {/* Center Content: Album Title, Info & Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10">
          {album.kind === "custom" && (
            <span className="mb-1 rounded-full border border-[#8ab4f8]/40 bg-[#8ab4f8]/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#8ab4f8] backdrop-blur-md shadow-sm">
              Virtual Album
            </span>
          )}
          <h3 className="text-xs sm:text-sm md:text-base font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-105 line-clamp-2 px-1">
            {album.name}
          </h3>
          <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-zinc-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
          </p>
          {album.description && (
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-zinc-400 line-clamp-1 max-w-[85%] drop-shadow">
              {album.description}
            </p>
          )}
        </div>
      </Link>

      {/* Top-Right: 3-dots Menu Button */}
      {(onRename || onDelete) && (
        <div className="absolute top-2.5 right-2.5 z-30" ref={menuRef}>
          <button
            type="button"
            title="Album options"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="flex size-7 items-center justify-center rounded-xl bg-black/60 text-zinc-300 backdrop-blur-md transition hover:bg-black/90 hover:text-white cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-40 w-36 overflow-hidden rounded-2xl border border-[#2e2e2e] bg-[#161616]/98 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              {onRename && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onRename(album);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-zinc-200 transition hover:bg-[#212121] cursor-pointer"
                >
                  <Pencil size={13} className="text-[#8ab4f8]" />
                  <span>Rename</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(album);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
