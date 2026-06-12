'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useCustomerAuth';
import { User, Mail, Phone, MapPin, ShoppingBag, Heart, LogOut, Loader, Save, ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SettingsPage() {
  const router = useRouter();
  const { customer, token, isLoading, updateProfile, changePassword, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<{
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  }>({
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    zip: '',
  });

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleSave = async () => {
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name,
        phone,
        address,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!mounted || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Please log in to access settings</p>
        <Link
          href="/login"
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/account"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Profile Settings */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email (cannot be changed)</label>
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border border-border rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{customer.email}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-lg"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-lg"
              placeholder="Your phone number"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Address</label>
            <div className="space-y-2">
              <input
                type="text"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-lg"
                placeholder="Street address"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-lg"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-lg"
                  placeholder="State"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-lg"
                  placeholder="Country"
                />
                <input
                  type="text"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-lg"
                  placeholder="ZIP code"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Password Settings */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-lg"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-lg"
              placeholder="Enter new password (min 8 characters)"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-lg"
              placeholder="Confirm new password"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={isChangingPassword}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isChangingPassword ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Change Password
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Quick Links</h2>
        <div className="space-y-2">
          <Link
            href="/cart"
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>My Cart</span>
          </Link>
          <Link
            href="/wishlist"
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors"
          >
            <Heart className="h-5 w-5" />
            <span>My Wishlist</span>
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>My Orders</span>
          </Link>
        </div>
      </div>

      {/* Logout */}
      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 w-full"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
