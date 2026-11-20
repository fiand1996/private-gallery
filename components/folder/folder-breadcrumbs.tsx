"use client";

import Link from "next/link";
import {
  CheckSquare,
  ChevronRight,
  FolderPlus,
  Home,
  Square,
} from "lucide-react";
import React from "react";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

interface FolderBreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  folderCount: number;
  imageCount: number;
  isAdmin: boolean;
  isAllSelected: boolean;
  hasItems: boolean;
  uploadMenuNode?: React.ReactNode;
  onToggleSelectAll: () => void;
  onOpenCreateFolder: () => void;
}

export function FolderBreadcrumbs({
  breadcrumbs,
  folderCount,
  imageCount,
  isAdmin,
  isAllSelected,
  hasItems,
  uploadMenuNode,
  onToggleSelectAll,
  onOpenCreateFolder,
}: FolderBreadcrumbsProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Breadcrumb Path & Stats */}
      <div className="flex flex-col gap-1.5">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500"
        >
          <Link
            href="/folder"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-300 transition hover:bg-zinc-800"
          >
            <Home size={14} />
            <span>Root</span>
          </Link>

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={crumb.path} className="flex items-center gap-1.5">
                <ChevronRight size={13} className="text-zinc-500" />
                {isLast ? (
                  <span className="font-semibold text-zinc-100 px-2 py-1">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={`/folder?path=${encodeURIComponent(crumb.path)}`}
                    className="rounded-lg px-2 py-1 text-zinc-400 hover:bg-[#1a1a1a] hover:text-zinc-200 transition"
                  >
                    {crumb.name}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 pl-2 text-[11px] text-zinc-400">
          <span>{folderCount} folders</span>
          <span>·</span>
          <span>{imageCount} photos</span>
        </div>
      </div>

      {/* Action Buttons: Upload, New Folder, Select All */}
      <div className="flex flex-wrap items-center gap-2">
        {isAdmin && uploadMenuNode}

        {isAdmin && (
          <button
            type="button"
            onClick={onOpenCreateFolder}
            className="flex items-center gap-2 rounded-xl border border-[#262626] bg-[#141414] px-3 py-1.5 text-xs font-semibold text-zinc-300 shadow-sm transition hover:bg-[#1f1f1f] cursor-pointer"
          >
            <FolderPlus size={14} className="text-[#8ab4f8]" />
            <span>New Folder</span>
          </button>
        )}

        {hasItems && (
          <button
            type="button"
            onClick={onToggleSelectAll}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              isAllSelected
                ? "border-[#8ab4f8] bg-[#8ab4f8]/15 text-[#8ab4f8]"
                : "border-[#262626] bg-[#141414] text-zinc-300 hover:bg-[#1f1f1f]"
            }`}
          >
            {isAllSelected ? (
              <CheckSquare size={14} className="text-[#8ab4f8]" />
            ) : (
              <Square size={14} className="text-zinc-400" />
            )}
            <span>
              {isAllSelected ? "Deselect All" : "Select All (Ctrl+A)"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
