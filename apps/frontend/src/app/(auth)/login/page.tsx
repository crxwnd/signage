/**
 * Login Page
 * User authentication with email and password
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
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
import { login, ApiError } from '@/lib/api/auth';

/**
 * Login form validation schema
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear API error when user starts typing
    if (apiError) {
      setApiError(null);
    }
  };

  /**
   * Handle form submission
   * SECURITY: Multiple layers of protection against form GET submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // CRITICAL: Prevent default form submission behavior
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple submissions
    if (isLoading) {
      return false;
    }

    // Clear previous errors
    setErrors({});
    setApiError(null);

    // Validate form data
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    // Submit login request via API (POST)
    setIsLoading(true);
    try {
      // API call with POST method - credentials in body, NOT in URL
      await login(result.data);

      // Redirect to displays page on success
      router.push('/displays');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'INVALID_CREDENTIALS') {
          setApiError('Invalid email or password');
        } else {
          setApiError(error.message || 'An error occurred during login');
        }
      } else {
        setApiError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }

    return false;
  };

  /**
   * Handle button click - extra layer of security
   */
  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Manually trigger form submission through our handler
    const form = e.currentTarget.closest('form');
    if (form) {
      const syntheticEvent = new Event('submit', {
        bubbles: true,
        cancelable: true
      }) as any;
      await handleSubmit(syntheticEvent);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/*
            SECURITY NOTE:
            - NO action attribute (prevents form GET submission)
            - NO method attribute (prevents default GET behavior)
            - onSubmit with preventDefault (programmatic control)
          */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* API Error Message */}
            {apiError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{apiError}</p>
              </div>
            )}

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
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Submit Button - type="button" for extra control */}
            <Button
              type="button"
              onClick={handleButtonClick}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>

            {/* Register Link */}
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Create one
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
