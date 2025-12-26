/**
 * Player Root Layout
 * Next.js 14 App Router
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signage Player',
  description: 'Digital Signage Player for SmartTVs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-black">{children}</body>
    </html>
  );
}

