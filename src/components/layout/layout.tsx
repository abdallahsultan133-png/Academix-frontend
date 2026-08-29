"use client";

import { Header } from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";
import { cn } from "@/lib/utils.ts";
import type { CSSProperties, PropsWithChildren } from "react";
import { Sidebar } from "./sidebar.tsx";

// Desktop starts expanded, but a user's explicit collapse/expand choice is
// persisted by the shadcn SidebarProvider in the `sidebar_state` cookie — honour
// it on reload instead of always snapping back to expanded.
function getDefaultSidebarOpen() {
  if (typeof document === "undefined") return true;
  const match = document.cookie.match(/(?:^|;\s*)sidebar_state=([^;]+)/);
  return match ? match[1] === "true" : true;
}

export function Layout({ children }: PropsWithChildren) {
  return (
      <SidebarProvider
        defaultOpen={getDefaultSidebarOpen()}
        style={{ "--sidebar-width-icon": "3.25rem" } as CSSProperties}
      >
        <Sidebar />
        <SidebarInset>
          <div className="print:hidden">
            <Header />
          </div>

          <main
              className={cn(
                  "@container/main",
                  "container",
                  "mx-auto",
                  "relative",
                  "w-full",
                  "flex",
                  "flex-col",
                  "flex-1",
                  "px-2",
                  "pt-4",
                  "md:p-4",
                  "lg:px-6",
                  "lg:pt-6",
                  "print:p-0"
              )}
          >
            {children}
          </main>

        </SidebarInset>
      </SidebarProvider>
  );
}
Layout.displayName = "Layout";
