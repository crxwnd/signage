/**
 * Frontend Root Layout
 * Next.js 14 App Router
 */

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { SocketProvider } from '@/providers/SocketProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Signage - Digital Signage System',
  description: 'Sistema de Señalización Digital para Hoteles',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster />
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
