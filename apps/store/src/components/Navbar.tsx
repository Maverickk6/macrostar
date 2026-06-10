'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, Monitor, MapPin, Phone, Heart, LogOut, User, Settings, ShoppingBag, LogIn, Sun, Moon } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { useWishlist } from '@/store/useWishlist';
import { useAuth } from '@/store/useCustomerAuth';
import { useTheme } from '@/lib/theme-provider';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const totalItems = useCart((state) => state.getTotalItems());
  const wishlistItems = useWishlist((state) => state.items.length);
  const { customer, token, logout } = useAuth();
  const isAuthenticated = token !== null && customer !== null;

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Store & Products' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact Us' },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Top Banner with Location and Contact */}
      <div className="bg-primary text-primary-foreground text-xs py-1 px-4 flex justify-between items-center z-50 relative font-medium">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span>Opposite First Bank PLC, Ekpoma, Edo State</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="tel:+2348000000000" className="flex items-center gap-1 hover:underline">
            <Phone className="h-3.5 w-3.5" />
            <span>+234 80 0000 0000</span>
          </Link>
          {/* <Link href="http://localhost:3001" className="text-xs hover:underline bg-black/20 px-2 py-0.5 rounded">
            Admin Portal
          </Link> */}
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-300',
          isScrolled
            ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-lg'
            : 'bg-background border-b border-border/50'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Monitor className="h-6 w-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-foreground bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  MacroStar
                </span>
                <span className="text-[10px] block text-muted-foreground font-semibold tracking-wider uppercase -mt-1">
                  Technologies
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary relative py-2',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Icons & Auth */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 hover:bg-muted rounded-full transition-colors group"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <Moon className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                )}
              </button>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative p-2.5 hover:bg-muted rounded-full transition-colors group">
                <Heart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                {wishlistItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {wishlistItems}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative p-2.5 hover:bg-muted rounded-full transition-colors group">
                <ShoppingCart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Auth Section */}
              {isAuthenticated ? (
                // User Profile Dropdown
                <div className="hidden sm:block relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-400 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {customer?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-0 w-56 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {/* Profile Header */}
                    <div className="p-4 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">{customer?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{customer?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted text-sm text-foreground transition-colors"
                      >
                        <User className="h-4 w-4" />
                        My Account
                      </Link>

                      <Link
                        href="/orders"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted text-sm text-foreground transition-colors"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        My Orders
                      </Link>

                      <Link
                        href="/wishlist"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted text-sm text-foreground transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        Wishlist ({wishlistItems})
                      </Link>

                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted text-sm text-foreground transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted text-sm text-red-600 transition-colors border-t border-border mt-2 pt-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Auth Buttons
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="sm:hidden p-2 hover:bg-muted rounded-full transition-colors text-foreground"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="sm:hidden border-t border-border bg-background animate-in slide-in-from-top duration-200">
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'block px-3 py-3 rounded-lg text-base font-semibold transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Mobile Auth */}
              {isAuthenticated ? (
                <>
                  <div className="border-t border-border/50 pt-4 mt-4 px-3 space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-400 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {customer?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{customer?.name}</p>
                        <p className="text-xs text-muted-foreground">{customer?.email}</p>
                      </div>
                    </div>

                    <Link
                      href="/account"
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      My Account
                    </Link>

                    <Link
                      href="/orders"
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      My Orders
                    </Link>

                    <Link
                      href="/wishlist"
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Wishlist ({wishlistItems})
                    </Link>

                    <Link
                      href="/settings"
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Settings
                    </Link>

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-muted transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-border/50 pt-4 mt-4 px-3 space-y-2">
                    <Link
                      href="/login"
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="block px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )}

              <div className="border-t border-border/50 pt-4 mt-4 px-3 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Office Location:</p>
                <p className="text-sm font-medium text-foreground">
                  Opposite First Bank PLC, Ekpoma, Edo State
                </p>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
