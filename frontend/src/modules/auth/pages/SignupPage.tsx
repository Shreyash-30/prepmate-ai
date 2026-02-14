/**
 * Signup Page - Premium SaaS Design
 * Professional registration experience
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, User, Mail, Lock, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'password') {
      setPasswordErrors(validatePassword(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (passwordErrors.length > 0) {
      alert('Please fix password requirements');
      return;
    }
    await signup(formData.name, formData.email, formData.password);
    navigate('/');
  };

  const isFormValid =
    formData.name && formData.email && formData.password && formData.confirmPassword && passwordErrors.length === 0;

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
          <p className="text-muted-foreground">Start your interview preparation journey</p>
        </div>

        {/* Signup Card */}
        <div className="rounded-2xl border border-primary-500/20 bg-card/95 backdrop-blur-xl p-8 shadow-2xl">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="pl-12 h-11 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
            </div>

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

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-4 w-4 rounded-full flex items-center justify-center',
                      formData.password.length >= 8 ? 'bg-success/20' : 'bg-border/30'
                    )}>
                      {formData.password.length >= 8 && <Check className="h-3 w-3 text-success" />}
                    </div>
                    <span className={cn(
                      'text-xs',
                      formData.password.length >= 8 ? 'text-success' : 'text-muted-foreground'
                    )}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-4 w-4 rounded-full flex items-center justify-center',
                      /[A-Z]/.test(formData.password) ? 'bg-success/20' : 'bg-border/30'
                    )}>
                      {/[A-Z]/.test(formData.password) && <Check className="h-3 w-3 text-success" />}
                    </div>
                    <span className={cn(
                      'text-xs',
                      /[A-Z]/.test(formData.password) ? 'text-success' : 'text-muted-foreground'
                    )}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-4 w-4 rounded-full flex items-center justify-center',
                      /[0-9]/.test(formData.password) ? 'bg-success/20' : 'bg-border/30'
                    )}>
                      {/[0-9]/.test(formData.password) && <Check className="h-3 w-3 text-success" />}
                    </div>
                    <span className={cn(
                      'text-xs',
                      /[0-9]/.test(formData.password) ? 'text-success' : 'text-muted-foreground'
                    )}>
                      One number
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className={cn(
                    'pl-12 h-11 border-border/50 focus:border-primary/50 focus:ring-primary/20',
                    formData.confirmPassword && formData.password !== formData.confirmPassword && 'border-destructive/50'
                  )}
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-destructive mt-2">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" id="terms" className="mt-1" required />
              <label htmlFor="terms">
                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full h-11 bg-gradient-to-r from-primary to-primary-600 hover:shadow-lg font-semibold text-base transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-primary-foreground border-r-transparent animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
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

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-3">
            <button className="h-10 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
              <span className="text-lg">👨</span> Google
            </button>
            <button className="h-10 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
              <span className="text-lg">💻</span> GitHub
            </button>
          </div>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-600 hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
