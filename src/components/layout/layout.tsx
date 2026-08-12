"use client";

import { Header } from "@/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";
import { cn } from "@/lib/utils.ts";
import type { PropsWithChildren } from "react";
import { Sidebar } from "./sidebar.tsx";

export function Layout({ children }: PropsWithChildren) {
  return (
      <SidebarProvider>
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
