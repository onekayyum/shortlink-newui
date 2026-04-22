"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Link as LinkIcon, Settings, ShieldAlert, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import clsx from 'clsx';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin Panel', href: '/admin', icon: ShieldAlert });
  }

  return (
    <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-md hidden md:flex flex-col h-full">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <LinkIcon size={18} />
          </div>
          LinkSaaS
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon size={20} className={isActive ? "text-primary" : "text-muted-foreground"} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
