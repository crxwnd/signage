/**
 * Frontend Root Layout
 * Next.js 14 App Router with Dark Mode Support
 */

import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { SocketProvider } from '@/providers/SocketProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/providers/ThemeProvider';

// Space Grotesk - Modern, distinctive font
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Signage - Digital Signage System',
  description: 'Sistema de Senalizacion Digital para Hoteles',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <SocketProvider>
                {children}
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    classNames: {
                      toast: 'glass rounded-xl',
                      title: 'font-medium',
                      description: 'text-muted-foreground',
                    },
                  }}
                />
              </SocketProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

