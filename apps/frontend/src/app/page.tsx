/**
 * Frontend Home Page
 * Next.js 14 App Router
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Digital Signage System
        </h1>
        <p className="text-xl text-muted-foreground">
          Sistema de Señalización Digital para Hoteles
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/displays"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ver Displays
          </Link>
        </div>
      </div>
    </div>
  );
}
