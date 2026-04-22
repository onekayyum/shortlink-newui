"use client";
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          {/* Subtle background glow for premium feel */}
          <div className="absolute top-0 left-1/4 w-1/2 h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full" />
          {children}
        </main>
      </div>
    </div>
  );
}
