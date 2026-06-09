'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useCustomerAuth';
import { User, Mail, Phone, MapPin, ShoppingBag, Heart, Settings, LogOut, Loader, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AccountPage() {
  const router = useRouter();
  const { customer, token, isLoading, updateProfile, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    zip: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || {
        street: '',
        city: '',
        state: '',
        country: 'Nigeria',
        zip: '',
      });
    }
  }, [mounted, customer]);

  if (!mounted || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading your account...</p>
      </div>
    );
  }

  if (!token || !customer) {
    router.push('/login');
    return null;
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile({
        name,
        phone,
        address,
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(customer.name || '');
    setPhone(customer.phone || '');
    setAddress(customer.address || {
      street: '',
      city: '',
      state: '',
      country: 'Nigeria',
      zip: '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const quickLinks = [
    {
      icon: ShoppingBag,
      label: 'My Orders',
      description: 'Track your order history',
      href: '/orders',
      count: null,
    },
    {
      icon: Heart,
      label: 'Wishlist',
      description: 'View saved items',
      href: '/wishlist',
      count: null,
    },
    {
      icon: Settings,
      label: 'Account Settings',
      description: 'Manage your preferences',
      href: '/settings',
      count: null,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">My Account</h1>
        <p className="text-muted-foreground mt-2">Manage your profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-400 rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold">
                {customer.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">{customer.name}</h2>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div className="text-center p-3 bg-muted/40 rounded-xl">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              <div className="text-center p-3 bg-muted/40 rounded-xl">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-muted-foreground">Wishlist</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Quick Links */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm uppercase text-muted-foreground tracking-wider">Quick Links</h3>
            <div className="space-y-2">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 p-3 hover:bg-muted rounded-xl transition-colors group"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/60 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Profile Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Personal Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={customer.email}
                      disabled
                      className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-sm opacity-50 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!isEditing}
                      placeholder="+234 80 1234 5678"
                      className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Address Information
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Street Address</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    disabled={!isEditing}
                    placeholder="e.g. 12 Main Street, opposite school gate"
                    className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Ekpoma"
                      className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">State</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Edo"
                      className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Country</label>
                    <input
                      type="text"
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      disabled={!isEditing}
                      className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">ZIP/Postal Code</label>
                    <input
                      type="text"
                      value={address.zip}
                      onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                      disabled={!isEditing}
                      placeholder="310001"
                      className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Account Security */}
          <div className="bg-card border border-border/60 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Account Security</h2>
            <div className="space-y-4">
              <Link
                href="/settings"
                className="flex items-center justify-between p-4 bg-muted/40 rounded-xl hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Change Password</p>
                    <p className="text-xs text-muted-foreground">Update your password</p>
                  </div>
                </div>
                <div className="text-primary group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
