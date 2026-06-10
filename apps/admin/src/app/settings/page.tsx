'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/store/useAuth';
import { 
  Store, 
  CreditCard, 
  Percent, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Save, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Building2,
  DollarSign,
  Settings as SettingsIcon,
  Lock,
  User
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface StoreSettings {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
}

interface PaymentSettings {
  paystackPublicKey: string;
  paystackSecretKey: string;
  currency: string;
}

interface TaxSettings {
  enabled: boolean;
  rate: number;
  taxId: string;
}

export default function SettingsPage() {
  const token = useAuth((state) => state.token);
  const [activeTab, setActiveTab] = useState<'store' | 'payment' | 'tax' | 'account'>('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Store Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: 'MacroStar Technologies',
    email: 'info@macrostar.ng',
    phone: '+234 80 0000 0000',
    address: {
      street: 'Opposite First Bank PLC',
      city: 'Ekpoma',
      state: 'Edo',
      country: 'Nigeria',
      zip: '310001',
    },
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    paystackPublicKey: '',
    paystackSecretKey: '',
    currency: 'NGN',
  });

  // Tax Settings
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    enabled: false,
    rate: 0,
    taxId: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Update state with fetched settings
        if (data.data.store) {
          setStoreSettings(data.data.store);
        }
        if (data.data.payment) {
          setPaymentSettings(data.data.payment);
        }
        if (data.data.tax) {
          setTaxSettings(data.data.tax);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings');
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'store',
          settings: storeSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save store settings');
      }

      const data = await response.json();
      toast.success('Store settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save store settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'payment',
          settings: paymentSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save payment settings');
      }

      const data = await response.json();
      toast.success('Payment settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTaxSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'tax',
          settings: taxSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save tax settings');
      }

      const data = await response.json();
      toast.success('Tax settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save tax settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }

      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <span>System Settings</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure store, payment, and tax settings</p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-2xl text-red-200 text-xs flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50">
        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'store'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4 inline mr-2" />
          Store Settings
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'payment'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="h-4 w-4 inline mr-2" />
          Payment Settings
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'tax'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Percent className="h-4 w-4 inline mr-2" />
          Tax Settings
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'account'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="h-4 w-4 inline mr-2" />
          Account Settings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'store' && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSaveStoreSettings} className="space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Store className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Store Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Store Name</label>
                <input
                  type="text"
                  value={storeSettings.name}
                  onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  value={storeSettings.email}
                  onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <input
                  type="tel"
                  value={storeSettings.phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Website URL</label>
                <input
                  type="url"
                  value="https://macrostar.ng"
                  disabled
                  className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-sm opacity-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Store Address
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Street Address</label>
                  <input
                    type="text"
                    value={storeSettings.address.street}
                    onChange={(e) => setStoreSettings({ 
                      ...storeSettings, 
                      address: { ...storeSettings.address, street: e.target.value }
                    })}
                    className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">City</label>
                  <input
                    type="text"
                    value={storeSettings.address.city}
                    onChange={(e) => setStoreSettings({ 
                      ...storeSettings, 
                      address: { ...storeSettings.address, city: e.target.value }
                    })}
                    className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">State</label>
                  <input
                    type="text"
                    value={storeSettings.address.state}
                    onChange={(e) => setStoreSettings({ 
                      ...storeSettings, 
                      address: { ...storeSettings.address, state: e.target.value }
                    })}
                    className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Country</label>
                  <input
                    type="text"
                    value={storeSettings.address.country}
                    onChange={(e) => setStoreSettings({ 
                      ...storeSettings, 
                      address: { ...storeSettings.address, country: e.target.value }
                    })}
                    className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">ZIP/Postal Code</label>
                  <input
                    type="text"
                    value={storeSettings.address.zip}
                    onChange={(e) => setStoreSettings({ 
                      ...storeSettings, 
                      address: { ...storeSettings.address, zip: e.target.value }
                    })}
                    className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
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
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Store Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSavePaymentSettings} className="space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Payment Configuration</h2>
            </div>

            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl text-amber-200 text-xs">
              <p className="font-semibold mb-1">Paystack Integration</p>
              <p>Configure your Paystack payment gateway credentials to process online payments securely.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Paystack Public Key</label>
                <input
                  type="text"
                  value={paymentSettings.paystackPublicKey}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, paystackPublicKey: e.target.value })}
                  placeholder="pk_test_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Used in the storefront for payment initialization</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Paystack Secret Key</label>
                <input
                  type="password"
                  value={paymentSettings.paystackSecretKey}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, paystackSecretKey: e.target.value })}
                  placeholder="sk_test_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Used server-side for payment verification and webhooks</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" />
                  Default Currency
                </label>
                <select
                  value={paymentSettings.currency}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                >
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Payment Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSaveTaxSettings} className="space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Percent className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Tax Configuration</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                <div>
                  <h3 className="font-semibold text-sm">Enable Tax Calculation</h3>
                  <p className="text-xs text-muted-foreground">Automatically calculate tax on orders</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTaxSettings({ ...taxSettings, enabled: !taxSettings.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    taxSettings.enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      taxSettings.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {taxSettings.enabled && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxSettings.rate}
                      onChange={(e) => setTaxSettings({ ...taxSettings, rate: parseFloat(e.target.value) })}
                      placeholder="7.5"
                      className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">Enter the tax percentage (e.g., 7.5 for 7.5%)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Tax ID / VAT Number</label>
                    <input
                      type="text"
                      value={taxSettings.taxId}
                      onChange={(e) => setTaxSettings({ ...taxSettings, taxId: e.target.value })}
                      placeholder="123456789-0001"
                      className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">Your business tax identification number</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Tax Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Change Password</h2>
            </div>

            <div className="p-4 bg-blue-950/20 border border-blue-800/40 rounded-xl text-blue-200 text-xs">
              <p className="font-semibold mb-1">Security Notice</p>
              <p>Choose a strong password with at least 6 characters. Avoid using common words or personal information.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Enter your current password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Enter your new password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Confirm your new password"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
