'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useCustomerAuth';
import { toast } from 'sonner';
import { Mail, Lock, Loader, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">Sign in to your MacroStar account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-xl p-6 shadow-lg">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 bg-background"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 bg-background"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 border border-border rounded cursor-pointer"
                defaultChecked
              />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isLoading && <Loader className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Sign up here
            </Link>
          </p>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-background text-muted-foreground">or continue as guest</span>
            </div>
          </div>

          <Link
            href="/products"
            className="block w-full px-4 py-2.5 border border-border rounded-lg font-medium hover:bg-muted transition-colors text-foreground"
          >
            Browse Products
          </Link>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Need help? Contact us at support@macrostar.ng</p>
          <p>Password must be at least 6 characters</p>
        </div>
      </div>
    </div>
  );
}
