import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { FolderView } from "@/components/pages/folder-page";

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <FolderView />
      </Suspense>
    </AppShell>
  );
}
