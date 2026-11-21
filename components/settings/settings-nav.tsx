"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  HardDrive,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useLibrary } from "@/components/layout/library-context";

export function SettingsNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { libraries } = useLibrary();
  const isAdmin = session?.user?.role === "admin";

  const isLibraries = pathname === "/settings/libraries" || pathname === "/settings";
  const isPreferences = pathname === "/settings/preferences";
  const isTasks = pathname === "/settings/tasks";
  const isUsers = pathname === "/settings/users";

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your gallery preferences, media directories, and background tasks.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer sm:self-auto"
        >
          <ArrowLeft size={14} />
          Back to Gallery
        </Link>
      </div>

      {/* Navigation Tab Pills */}
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-border-subtle pb-3">
        <Link
          href="/settings/libraries"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
            isLibraries
              ? "bg-accent text-zinc-950 shadow-sm"
              : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          }`}
        >
          <HardDrive size={15} />
          <span>Media Libraries</span>
          {libraries.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isLibraries
                  ? "bg-zinc-950/20 text-zinc-950"
                  : "bg-border-subtle text-text-secondary"
              }`}
            >
              {libraries.length}
            </span>
          )}
        </Link>

        <Link
          href="/settings/preferences"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
            isPreferences
              ? "bg-accent text-zinc-950 shadow-sm"
              : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          }`}
        >
          <SlidersHorizontal size={15} />
          <span>General Preferences</span>
        </Link>

        <Link
          href="/settings/tasks"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
            isTasks
              ? "bg-accent text-zinc-950 shadow-sm"
              : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          }`}
        >
          <Activity size={15} />
          <span>Tasks & System</span>
        </Link>

        {isAdmin && (
          <Link
            href="/settings/users"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
              isUsers
                ? "bg-accent text-zinc-950 shadow-sm"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
          >
            <Users size={15} />
            <span>User Management</span>
          </Link>
        )}
      </div>
    </>
  );
}
