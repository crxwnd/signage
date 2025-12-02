/**
 * Register Page
 * User registration with email, password, and name
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { UserPlus, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
} from '@/components/ui';
import { register, ApiError } from '@/lib/api/auth';

/**
 * Register form validation schema
 */
const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear API error when user starts typing
    if (apiError) {
      setApiError(null);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    setApiError(null);

    // Validate form data
    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Submit registration request
    setIsLoading(true);
    try {
      await register({
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
      });

      // Show success message
      setIsSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'EMAIL_ALREADY_EXISTS') {
          setApiError('An account with this email already exists');
        } else if (error.code === 'VALIDATION_ERROR') {
          setApiError('Invalid input. Please check your information');
        } else {
          setApiError(error.message || 'An error occurred during registration');
        }
      } else {
        setApiError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold">
                Account Created Successfully!
              </h2>
              <p className="mt-2 text-muted-foreground">
                Redirecting to login page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Fill in your information to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* API Error Message */}
            {apiError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{apiError}</p>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.name ? 'border-destructive' : ''}
                autoComplete="name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.email ? 'border-destructive' : ''}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.password ? 'border-destructive' : ''}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className={errors.confirmPassword ? 'border-destructive' : ''}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
