import { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileTopBar } from "@/components/dashboard/TopBar";
import { PageTransition } from "@/components/PageTransition";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileTopBar />
        <PageTransition>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8 space-y-6">{children}</main>
        </PageTransition>
      </div>
    </div>
  );
}
