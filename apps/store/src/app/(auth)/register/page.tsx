'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/useCustomerAuth';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, Loader, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!agreed) {
      toast.error('Please agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.phone || undefined
      );
      toast.success('Account created successfully!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  const passwordStrength = formData.password.length >= 6 ? 'strong' : formData.password.length >= 4 ? 'medium' : 'weak';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-muted-foreground">Join MacroStar to start shopping</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-xl p-6 shadow-lg">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 bg-background"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 bg-background"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Phone (Optional) */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-foreground">
              Phone Number <span className="text-muted-foreground">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 bg-background"
                placeholder="+234 80 0000 0000"
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
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
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
            {/* Password Strength Indicator */}
            <div className="flex gap-1 mt-1">
              <div className={`flex-1 h-1 rounded-full ${passwordStrength === 'strong' ? 'bg-green-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            </div>
            <p className={`text-xs ${passwordStrength === 'strong' ? 'text-green-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
              {formData.password.length === 0 ? 'Enter a password' : passwordStrength === 'strong' ? 'Strong password' : 'Use at least 6 characters'}
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 bg-background"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.password && formData.confirmPassword && (
              <div className="flex items-center gap-2 text-xs">
                {formData.password === formData.confirmPassword ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <div className="h-4 w-4 border-2 border-red-600 rounded-full" />
                    <span className="text-red-600">Passwords don't match</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start gap-3 py-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 border border-border rounded cursor-pointer mt-1"
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
              I agree to MacroStar's{' '}
              <Link href="/terms" className="text-primary hover:underline font-medium">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !agreed}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isLoading && <Loader className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>We'll never share your email address</p>
          <p>All data is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}
