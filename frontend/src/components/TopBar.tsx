"use client";
import { useAuthStore } from '@/lib/store';
import { Menu, User as UserIcon } from 'lucide-react';

export default function TopBar() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-muted-foreground hover:text-foreground">
          <Menu size={24} />
        </button>
        {/* Breadcrumb or title could go here */}
        <h2 className="hidden md:block font-semibold text-foreground/80 capitalize">
          {user?.role === 'admin' ? 'Admin / Dashboard' : 'Dashboard'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full border border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <UserIcon size={16} />
          </div>
          <span className="text-sm font-medium">{user?.username}</span>
          {user?.role === 'admin' && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold ml-2">
              Admin
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
