import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AlbumsView } from "@/components/pages/albums-page";

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <AlbumsView />
      </Suspense>
    </AppShell>
  );
}
