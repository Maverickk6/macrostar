'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Mail, Phone, MapPin, Camera, Save, Lock, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  } | null;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [zip, setZip] = useState('');

  useEffect(() => {
    fetchCustomer();
  }, []);

  const fetchCustomer = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/customer/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok) {
        setCustomer(json.data);
        setName(json.data.name);
        setPhone(json.data.phone || '');
        if (json.data.address) {
          setStreet(json.data.address.street || '');
          setCity(json.data.address.city || '');
          setState(json.data.address.state || '');
          setCountry(json.data.address.country || '');
          setZip(json.data.address.zip || '');
        }
      } else {
        toast.error('Failed to load profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem('customer_token');
    if (!token) {
      toast.error('Not authenticated');
      setSaving(false);
      return;
    }

    try {
      const address = {
        street: street || undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        zip: zip || undefined,
      };

      const res = await fetch(`${API_URL}/api/auth/customer/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone: phone || null,
          address: Object.values(address).some(v => v) ? address : null,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success('Profile updated successfully!');
        setCustomer(json.data);
      } else {
        toast.error(json.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account information</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="relative mx-auto w-24 h-24 mb-4">
              {customer.avatar ? (
                imageError ? (
                  <img
                    src={customer.avatar}
                    alt={customer.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <Image
                    src={customer.avatar}
                    alt={customer.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover"
                    onError={() => setImageError(true)}
                  />
                )
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
              )}
              <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="font-bold text-lg">{customer.name}</h2>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Member since {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => router.push('/profile/change-password')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium"
            >
              <Lock className="h-4 w-4" />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-lg mb-6">Personal Information</h3>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={customer.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl"
                    placeholder="+234 80 0000 0000"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Street Address</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">ZIP/Postal Code</label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
