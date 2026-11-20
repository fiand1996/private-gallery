import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ExplorePage } from "@/components/pages/explore-page";

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <ExplorePage />
      </Suspense>
    </AppShell>
  );
}
