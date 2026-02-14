/**
 * Login Page - Premium SaaS Design
 * Professional authentication experience
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(formData.email, formData.password);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-background to-background p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-72 w-72 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 h-72 w-72 bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">PrepMate AI</h1>
          <p className="text-muted-foreground">Master your technical interviews</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-primary-500/20 bg-card/95 backdrop-blur-xl p-8 shadow-2xl">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="pl-12 h-11 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="pl-12 h-11 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary-600 hover:underline transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="w-full h-11 bg-gradient-to-r from-primary to-primary-600 hover:shadow-lg font-semibold text-base transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-primary-foreground border-r-transparent animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <button className="h-10 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
              <span className="text-lg">👨</span> Google
            </button>
            <button className="h-10 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
              <span className="text-lg">💻</span> GitHub
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-primary-600 hover:underline font-semibold">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 rounded-lg border border-primary-500/20 bg-primary-50/30 dark:bg-primary-900/20 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Demo Credentials</p>
          <p className="text-xs font-mono text-foreground">
            demo@example.com / password
          </p>
        </div>
      </div>
    </div>
  );
}
