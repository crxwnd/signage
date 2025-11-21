/**
 * Frontend Root Layout
 * Next.js 14 App Router
 */

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui';
import { SocketProvider } from '@/providers/SocketProvider';

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
        <SocketProvider>
          {children}
          <Toaster />
        </SocketProvider>
      </body>
    </html>
  );
}
