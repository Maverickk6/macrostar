'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/store/useAuth';
import {
  Monitor,
  LayoutDashboard,
  ShoppingBag,
  ListCollapse,
  Boxes,
  Compass,
  LogOut,
  User,
  Settings,
  ShieldCheck,
  RefreshCw,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { checkAuth, logout, user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const isAuthed = checkAuth();
    if (!isAuthed && pathname !== '/login') {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [pathname, router, checkAuth]);

  if (loading && pathname !== '/login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Verifying secure admin credentials...</p>
      </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  const menuItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Products', href: '/products', icon: ShoppingBag },
    { label: 'Categories', href: '/categories', icon: ListCollapse },
    { label: 'Orders & Sales', href: '/orders', icon: Compass },
    { label: 'Inventory', href: '/inventory', icon: Boxes },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-border/60 bg-card/50 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Logo */}
        <div className="h-16 flex items-center justify-between gap-2 px-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-foreground block">
                MacroStar Admin
              </span>
              <span className="text-[9px] block text-muted-foreground font-bold tracking-wider uppercase -mt-0.5">
                Control Panel
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-border/50 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">{user?.name || 'Administrator'}</span>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors text-left"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border/50 bg-card/25 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              <span className="hidden sm:inline">MacroStar Technologies Ltd — Edo State</span>
              <span className="sm:hidden">MacroStar Ltd</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              ₦ Naira Dashboard
            </span>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-grow p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
