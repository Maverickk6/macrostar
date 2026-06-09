'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useAuth';
import { Monitor, Lock, Mail, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const { login, checkAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checkAuth()) {
      router.push('/');
    }
  }, [router, checkAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Login failed');

      login(json.data.token, json.data.user);
      toast.success(`Welcome back, ${json.data.user.name}!`);
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection to Hono backend failed.');
      toast.error('Credentials invalid or server unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    toast.loading('Logging in with Offline Demo privileges...');
    setTimeout(() => {
      toast.dismiss();
      login('mock-demo-jwt-token', {
        id: 1,
        name: 'MacroStar Demo Admin',
        email: 'admin@macrostar.ng',
        role: 'superadmin',
      });
      toast.success('Offline privileges granted!');
      router.push('/');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-primary/10 via-background to-background px-4">
      <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
        {/* Brand logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 bg-primary/10 rounded-2xl text-primary mx-auto">
            <Monitor className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">MacroStar Admin</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Control panel portal credentials</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-2xl text-red-200 text-xs flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="admin@macrostar.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 pl-10"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 pl-10"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Sign In Security Portal'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border/50"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-muted-foreground uppercase">Developer Sandbox</span>
          <div className="flex-grow border-t border-border/50"></div>
        </div>

        {/* Sandbox toggle */}
        <button
          onClick={handleDemoLogin}
          type="button"
          className="w-full py-3 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl border border-border/50 transition-colors"
        >
          Bypass Auth (Simulate Sandbox Privileges)
        </button>
      </div>
    </div>
  );
}
