'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
import { debugLog, debugWarn } from '@/lib/debug';

/**
 * Rutas permitidas para redirección post-login
 * Solo rutas internas de la aplicación
 */
const ALLOWED_REDIRECT_PATHS = [
  '/home',
  '/displays',
  '/content',
  '/alerts',
  '/schedules',
  '/areas',
  '/sync-groups',
  '/analytics',
  '/reports',
  '/monitoring',
  '/settings',
  '/users',
];

/**
 * Sanitiza el parámetro redirect para prevenir Open Redirect attacks
 * @param url - URL del parámetro redirect
 * @returns URL sanitizada o '/home' si es inválida
 */
function sanitizeRedirect(url: string | null): string {
  // Default a home si no hay URL
  if (!url) return '/home';

  // Debe ser ruta relativa (empieza con /)
  if (!url.startsWith('/')) return '/home';

  // No debe ser protocol-relative (//evil.com)
  if (url.startsWith('//')) return '/home';

  // No debe contener protocol (javascript:, data:, https:)
  if (url.includes(':')) return '/home';

  // No debe tener caracteres de escape
  if (url.includes('\\')) return '/home';

  // Verificar contra allowlist de rutas
  const isAllowed = ALLOWED_REDIRECT_PATHS.some(
    (path) => url === path || url.startsWith(path + '/')
  );

  return isAllowed ? url : '/home';
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Hook de autenticación
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUrl = sanitizeRedirect(searchParams.get('redirect'));

  const handleSubmit = async (e: React.FormEvent) => {
    // 🛑 SEGURIDAD: Prevenir envío por GET y recarga
    e.preventDefault();
    e.stopPropagation();

    setError(null);
    setIsLoading(true);

    try {
      debugLog('Login', 'Iniciando login...');

      // CORRECCIÓN: Se pasa un objeto { email, password } en lugar de dos argumentos separados
      await login({ email, password });

      debugLog('Login', 'Login exitoso, redirigiendo a:', redirectUrl);
      router.push(redirectUrl);
    } catch (err: any) {
      debugWarn('Login', 'Error de login:', err);
      setError(err.message || 'Credenciales incorrectas o error de servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bienvenido</CardTitle>
          <CardDescription>
            Sistema de Señalización Digital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* CORRECCIÓN: Usamos un div con estilos directos en lugar del componente Alert para evitar errores de importación */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@hotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}