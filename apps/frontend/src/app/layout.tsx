/**
 * Frontend Root Layout
 * Next.js 14 App Router
 */

import type { Metadata } from 'next';

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
      <body>{children}</body>
    </html>
  );
}
