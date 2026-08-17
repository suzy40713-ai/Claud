"use client";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import PageTransition from "./PageTransition";
import FloatingCTA from "./FloatingCTA";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-w-0 flex-1 border-x-0 border-surface-border lg:border-x">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav />
      </div>
      <FloatingCTA />
    </div>
  );
}
