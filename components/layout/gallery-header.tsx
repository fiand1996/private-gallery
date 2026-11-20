"use client";

import Link from "next/link";
import { FolderPlus, HardDrive } from "lucide-react";
import { useLibrary } from "./library-context";
import { GallerySearch } from "@/components/search/gallery-search";
import type { GalleryPhoto } from "@/components/gallery/lightbox-modal";

interface GalleryHeaderProps {
  onSelectPhoto?: (photo: GalleryPhoto) => void;
  actions?: React.ReactNode;
}

export function GalleryHeader({ onSelectPhoto, actions }: GalleryHeaderProps) {
  const { libraries, selectedLibraryId, selectLibrary } = useLibrary();

  return (
    <header className="sticky top-0 z-20 border-b border-[#262626] bg-[#121212]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
        {/* Search bar */}
        <div className="flex-1 max-w-2xl">
          <GallerySearch
            libraryId={selectedLibraryId}
            onSelectPhoto={onSelectPhoto}
          />
        </div>

        {/* Right tools: Library selector & extra actions */}
        <div className="flex items-center gap-3">
          {actions}

          {libraries.length > 0 ? (
            <label className="flex h-10 items-center gap-2 rounded-full border border-[#262626] bg-[#1c1c1c] px-3.5 text-xs text-zinc-200 transition hover:bg-[#242424] shadow-sm">
              <HardDrive size={15} className="text-[#8ab4f8] shrink-0" />
              <select
                aria-label="Select library"
                value={selectedLibraryId ?? ""}
                onChange={(e) => selectLibrary(Number(e.target.value))}
                className="bg-transparent font-medium outline-none cursor-pointer max-w-[130px] sm:max-w-[200px] truncate"
              >
                {libraries.map((lib) => (
                  <option key={lib.id} value={lib.id} className="bg-[#181818] text-zinc-100">
                    {lib.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-full bg-[#8ab4f8] px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm transition hover:bg-[#aecbfa]"
            >
              <FolderPlus size={15} />
              <span>Add Library</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
