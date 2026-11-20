"use client";

import { type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { LibraryProvider } from "./library-context";
import { SettingsProvider } from "./settings-context";
import { GallerySidebar } from "./gallery-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>
        <LibraryProvider>
          <div className="min-h-screen bg-black text-zinc-100 lg:pl-64 pb-20 lg:pb-0">
            <GallerySidebar />
            <main className="min-h-screen">{children}</main>
          </div>
        </LibraryProvider>
      </SettingsProvider>
    </SessionProvider>
  );
}
