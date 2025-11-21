/**
 * Frontend Home Page
 * Next.js 14 App Router
 */

import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Sistema de Señalización Digital</CardTitle>
          <CardDescription>Sistema de Señalización Digital para Hoteles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Badge>shadcn/ui</Badge>
            <Badge variant="secondary">Next.js 14</Badge>
            <Badge variant="outline">Tailwind CSS</Badge>
          </div>

          <div className="space-y-3">
            <p className="text-muted-foreground">
              Frontend configurado con componentes shadcn/ui listos para usar.
            </p>

            <div className="flex gap-4">
              <Button asChild>
                <Link href="/displays">Ver Displays</Link>
              </Button>
              <Button variant="outline">Documentación</Button>
              <Button variant="ghost">Configuración</Button>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 bg-muted/50">
            <p className="text-sm font-medium">✅ Componentes instalados:</p>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
              <li>• Button - Botones con variantes</li>
              <li>• Card - Tarjetas con header/content/footer</li>
              <li>• Badge - Etiquetas y badges</li>
              <li>• Input - Campos de entrada</li>
              <li>• Dialog - Modales y diálogos</li>
              <li>• Toast - Notificaciones</li>
              <li>• Dropdown Menu - Menús desplegables</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
