"use client";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import DesktopTopBar from "./DesktopTopBar";
import BottomNav from "./BottomNav";
import PageTransition from "./PageTransition";
import FloatingCTA from "./FloatingCTA";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <DesktopTopBar />
      <TopBar />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-w-0 flex-1 border-x-0 border-surface-border lg:border-x">
            <PageTransition>{children}</PageTransition>
          </main>
          <BottomNav />
        </div>
        <FloatingCTA />
      </div>
    </div>
  );
}
