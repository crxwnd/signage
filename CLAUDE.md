# PROYECTO: Sistema de Señalización Digital para Hoteles

## 🎯 OBJETIVO DEL PROYECTO
Sistema de señalización digital para gestionar 100+ pantallas SmartTV en hoteles con:
- Sincronización exacta entre pantallas (50-200ms de precisión)
- Streaming de videos pesados (3GB+) con HLS adaptativo
- Caché local hasta 5GB por dispositivo
- Actualizaciones en tiempo real con latencia <10 segundos
- Gestión jerárquica de usuarios (Super Admin → Admin Hotel → Area Manager)
- Sistema de autenticación triple con 2FA

## 🛠️ TECH STACK (OBLIGATORIO)

### Frontend
- **React 18** con TypeScript 5.2+ (strict mode)
- **Next.js 14** con App Router
- **Tailwind CSS 3.x** + **shadcn/ui** para componentes
- **HLS.js** para reproducción de video
- **Socket.io-client** para tiempo real
- **Dexie.js** para IndexedDB (caché local)
- **MobX 6.x** para state management
- **Workbox** para Service Workers

### Backend
- **Node.js 20 LTS**
- **Express.js** para API REST
- **Socket.io 4.x** para WebSocket
- **TypeScript 5.2+** (strict mode)
- **PostgreSQL 15** con Prisma ORM
- **Redis 7** para cache y sesiones
- **BullMQ** para job queues
- **FFmpeg** con fluent-ffmpeg para video processing
- **MinIO** para almacenamiento de objetos (20-100TB)

### DevOps
- **Turborepo** para monorepo
- **PM2** para process management
- **Docker** para desarrollo y producción
- **GitLab CI/CD** para pipelines
- **Prometheus + Grafana** para monitoring
- **Winston** para logging

## 📂 ESTRUCTURA DEL PROYECTO

```
signage/
├── apps/
│   ├── frontend/          # Next.js App Router (puerto 3000)
│   ├── backend/           # Express API (puerto 3001)
│   └── player/            # Lightweight player para SmartTVs
├── packages/
│   ├── shared-types/      # Tipos TypeScript compartidos
│   ├── ui/                # Componentes React compartidos
│   ├── config/            # Configs compartidas (ESLint, Prettier, TS)
│   └── utils/             # Utilidades compartidas
├── docs/
│   ├── ARQUITECTURA.md
│   ├── PROGRESS.md
│   └── API.md
├── CLAUDE.md              # Este archivo
└── README.md
```

## 🎨 CONVENCIONES DE CÓDIGO

### TypeScript
```typescript
// ✅ SIEMPRE strict mode
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}

// ✅ NO usar 'any', usar 'unknown' si es necesario
const data: unknown = fetchData();

// ✅ Interfaces para props, types para unions
interface ButtonProps { /* ... */ }
type Status = 'online' | 'offline' | 'error';

// ✅ Importar tipos explícitamente
import type { Display, User } from '@shared-types';
```

### React
```tsx
// ✅ SOLO componentes funcionales con hooks
export function DisplayCard({ display }: DisplayCardProps) {
  const [status, setStatus] = useState<DisplayStatus>('online');
  // ...
}

// ✅ Naming conventions
// - Componentes: PascalCase
// - Funciones/variables: camelCase
// - Constantes: UPPER_SNAKE_CASE
// - Props interface: {ComponentName}Props

// ✅ Server Components por defecto, 'use client' solo cuando necesario
'use client'; // Solo si usa useState, useEffect, eventos, etc.

// ❌ NO clases de React
class DisplayCard extends Component { } // NUNCA
```

### Socket.io
```typescript
// ✅ Eventos nombrados en kebab-case con prefijos
socket.emit('display-status-changed', data);
socket.on('content-update', handler);
socket.on('admin-action', handler);

// ✅ Prefijos por módulo
// display-*    : Eventos de pantallas
// content-*    : Eventos de contenido
// admin-*      : Eventos administrativos
// sync-*       : Eventos de sincronización

// ✅ SIEMPRE tipados con interfaces de shared-types
import type { DisplayStatusEvent } from '@shared-types/socket-events';
socket.emit('display-status-changed', data satisfies DisplayStatusEvent);
```

### Estilos con Tailwind
```tsx
// ✅ Utility classes como prioridad
<div className="p-4 bg-white rounded-lg shadow-md">

// ✅ Sistema de espaciado: múltiplos de 8px (2, 4, 6, 8, 10, 12, 16)
<div className="p-4 m-8 gap-6"> // 16px, 32px, 24px

// ✅ Componentes shadcn/ui para UI base
import { Button, Card, Badge } from '@/components/ui';

// ❌ NO usar fuentes genéricas de IA
// ❌ Inter, Roboto → usar Space Grotesk o custom

// ✅ Responsive: mobile-first
<div className="w-full md:w-1/2 lg:w-1/3">
```

### API y Validación
```typescript
// ✅ Zod para validación de input
import { z } from 'zod';

const createDisplaySchema = z.object({
  name: z.string().min(3).max(100),
  location: z.string(),
  hotelId: z.string().uuid()
});

// ✅ Response format consistente
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// ✅ HTTP status codes apropiados
// 200: OK
// 201: Created
// 400: Bad Request
// 401: Unauthorized
// 403: Forbidden
// 404: Not Found
// 500: Internal Server Error
```

## 🔄 PATRONES DE ARQUITECTURA

### Gestión de Estado con Socket.io
```typescript
// BACKEND: Broadcast a sala específica
io.to(`display-${displayId}`).emit('display-update', {
  displayId,
  status: 'online',
  timestamp: Date.now()
});

// FRONTEND: Escuchar y actualizar estado local
socket.on('display-update', (data) => {
  displayStore.updateDisplay(data);
});
```

### Conductor Pattern para Sincronización
```typescript
// Una pantalla actúa como "conductor" (master)
// Las demás son "workers" (followers)
// El servidor gestiona quién es conductor y coordina sincronización

if (device.role === 'conductor') {
  // Enviar comandos de sync cada 100ms
  setInterval(() => {
    socket.emit('sync-command', {
      action: 'PLAY',
      timestamp: video.currentTime,
      contentId: currentContent.id
    });
  }, 100);
}
```

### Caché Local con IndexedDB
```typescript
// Dexie.js con estrategia de chunking
// Videos grandes (3GB+) se dividen en chunks de 10-20MB

class VideoDatabase extends Dexie {
  videos!: Table<CachedVideo>;
  chunks!: Table<VideoChunk>;
  
  constructor() {
    super('SignageDB');
    this.version(1).stores({
      videos: 'id, priority, scheduledTime, lastAccessed',
      chunks: 'id, videoId, chunkIndex'
    });
  }
}
```

## 📋 COMANDOS COMUNES

```bash
# Desarrollo
pnpm dev              # Iniciar todos los servicios
pnpm dev:frontend     # Solo frontend
pnpm dev:backend      # Solo backend

# Build
pnpm build            # Build de producción de todos los apps
pnpm typecheck        # Verificar tipos TypeScript en todo el monorepo

# Testing
pnpm test             # Tests con Vitest
pnpm test:e2e         # E2E con Playwright
pnpm test:watch       # Watch mode

# Linting y formatting
pnpm lint             # ESLint
pnpm format           # Prettier (auto-format)

# Base de datos
pnpm db:push          # Push schema a DB (desarrollo)
pnpm db:migrate       # Crear migration
pnpm db:studio        # Abrir Prisma Studio

# Docker
pnpm docker:up        # Levantar servicios (PostgreSQL, Redis, MinIO)
pnpm docker:down      # Detener servicios
```

## 🎯 WORKFLOW DE DESARROLLO

### Proceso Estándar para Nuevas Features

1. **EXPLORACIÓN** (No código todavía)
   ```
   "Lee la estructura actual del proyecto y archivos relevantes.
   NO escribas código todavía. Solo confirma tu entendimiento."
   ```

2. **PLANIFICACIÓN** (Thinking extendido)
   ```
   "Crea un plan detallado para [feature].
   Usa 'think harder' para razonamiento profundo.
   Incluye: componentes necesarios, endpoints, tipos, tests."
   ```

3. **IMPLEMENTACIÓN INCREMENTAL**
   - Implementa UN componente/endpoint a la vez
   - Prueba inmediatamente
   - Commit frecuente
   - Valida antes de continuar

4. **INTEGRACIÓN**
   - Conecta las piezas
   - Tests end-to-end
   - Corrige antes de siguiente feature

### Granularidad de Tareas

✅ **CORRECTO** (10-20 minutos):
```
"Crea el componente DisplayCard:
- Props: displayId, name, status, lastSeen
- Badge de estado con colores (verde/gris/rojo)
- Tailwind CSS
- Hover effect con info adicional
- TypeScript strict"
```

❌ **INCORRECTO** (demasiado amplio):
```
"Crea el módulo completo de gestión de pantallas"
```

## 🚨 INSTRUCCIONES CRÍTICAS PARA CLAUDE

### AL CREAR COMPONENTES REACT

✅ **SIEMPRE**:
- Importar tipos desde `@shared-types`
- Usar componentes shadcn/ui existentes primero
- Seguir sistema de espaciado de 8px
- Incluir PropTypes con TypeScript
- JSDoc para props complejas
- Tests unitarios básicos con Vitest

❌ **NUNCA**:
- Generar componentes sin entender contexto completo
- Usar estilos inline CSS
- Asumir requirements - PREGUNTAR si no está claro
- Sobre-ingenierizar - mantener simple

### AL CREAR APIs

✅ **SIEMPRE**:
- Validación con Zod en todas las entradas
- Try-catch en todos los handlers
- Logging con Winston (nivel apropiado)
- Tests de endpoints con Vitest
- Documentar con JSDoc

**Ejemplo estándar**:
```typescript
import { z } from 'zod';
import { logger } from '@/utils/logger';

const schema = z.object({
  name: z.string().min(1),
  // ...
});

export async function createDisplay(req: Request, res: Response) {
  try {
    const data = schema.parse(req.body);
    
    const display = await prisma.display.create({
      data
    });
    
    logger.info('Display created', { displayId: display.id });
    
    res.status(201).json({
      success: true,
      data: display,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to create display', { error });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

### AL TRABAJAR CON SOCKET.IO

✅ **SIEMPRE**:
- Usar tipos de `shared-types/socket-events.ts`
- Implementar manejo de reconexión
- Logs de eventos para debugging
- Tests de eventos críticos
- Manejo de errores con acknowledgments

```typescript
// Cliente
socket.on('connect', () => {
  logger.info('Socket connected');
  socket.emit('device:register', {
    deviceId: localStorage.getItem('deviceId'),
    type: 'smarttv'
  });
});

socket.on('disconnect', (reason) => {
  logger.warn('Socket disconnected', { reason });
  if (reason === 'io server disconnect') {
    socket.connect();
  }
});
```

### AL MANEJAR ERRORES

✅ **Pattern estándar**:
```typescript
try {
  // Operación
} catch (error) {
  if (error instanceof ZodError) {
    // Validación
  } else if (error instanceof PrismaClientKnownRequestError) {
    // DB error
  } else {
    // Error genérico
  }
  
  logger.error('Operation failed', {
    error,
    context: { /* ... */ }
  });
  
  throw new AppError('User-friendly message', 500);
}
```

## 🧪 TESTING

### Estrategia de Testing

- **Unit tests**: Funciones puras, utilidades, helpers
- **Integration tests**: Endpoints API, servicios
- **E2E tests**: Flujos críticos de usuario

### Ejemplo Unit Test
```typescript
import { describe, it, expect } from 'vitest';
import { calculateSyncOffset } from './sync-utils';

describe('calculateSyncOffset', () => {
  it('should calculate correct offset', () => {
    const offset = calculateSyncOffset(1000, 1050, 1100);
    expect(offset).toBe(25);
  });
});
```

### Ejemplo E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('admin can create new display', async ({ page }) => {
  await page.goto('/admin/displays');
  await page.click('button:has-text("Add Display")');
  await page.fill('input[name="name"]', 'Lobby Display 1');
  await page.click('button:has-text("Create")');
  await expect(page.locator('text=Display created')).toBeVisible();
});
```

## 📝 COMMITS

### Convención de Commits
```
type(scope): subject

[optional body]
[optional footer]
```

**Types**:
- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Documentación
- `style`: Formatting, no code change
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build, dependencies

**Ejemplo**:
```
feat(displays): add DisplayCard component

- Add responsive card component for display status
- Integrate with Socket.io for real-time updates
- Add unit tests

Closes #123
```

## 🔐 SEGURIDAD

### Checklist de Seguridad

- ✅ JWT tokens con expiración corta (15 min)
- ✅ Refresh tokens en httpOnly cookies
- ✅ 2FA con TOTP (otplib)
- ✅ Rate limiting en todos los endpoints
- ✅ CORS configurado correctamente
- ✅ Helmet.js para headers de seguridad
- ✅ Input validation con Zod
- ✅ SQL injection prevention con Prisma
- ✅ XSS prevention con sanitización
- ✅ Passwords hasheados con bcrypt (12 rounds)

## 🎯 OBJETIVOS DE RENDIMIENTO

- **Latencia de actualización**: <10 segundos
- **Sincronización entre pantallas**: 50-200ms
- **Uptime**: 99.9%+
- **Conexiones WebSocket simultáneas**: 100+
- **Video transcoding**: 3GB en ~10 minutos
- **Cache hit ratio**: 90%+
- **API response time p95**: <100ms

## 📊 MONITOREO

### Métricas Clave
- Conexiones WebSocket activas
- Tasa de desconexión de displays
- Latencia de entrega de contenido (p50, p95, p99)
- Estado de reproducción por dispositivo
- Uso de almacenamiento (caché + storage)
- Queue length de BullMQ
- Database query performance

## ⚠️ IMPORTANTE: PROCESO DE DESARROLLO

1. **NUNCA generar código sin entender contexto completo primero**
2. **SIEMPRE preguntar si algo no está claro** - no asumir
3. **SEGUIR patrones existentes** en el código
4. **NO sobre-ingenierizar** - mantener simple
5. **TYPECHECK antes de cada commit**: `pnpm typecheck`
6. **Tests para lógica de negocio** - mínimo para funciones críticas

## 🎓 CONTEXTO DEL NEGOCIO

- Sistema maneja **100+ pantallas SmartTV** simultáneamente en hoteles
- **Crítico**: Sincronización de estado en tiempo real
- Hoteles tienen múltiples displays en áreas (recepción, restaurant, spa, etc.)
- Contenido: videos HLS, imágenes estáticas, HTML animado, playlists mixtas
- Usuarios: Super Admin → Admin Hotel → Area Manager (jerarquía estricta)
- Operación 24/7 con personal IT limitado → failover automático esencial
- Videos muy pesados (3GB+) requieren estrategia híbrida: streaming + caché local
- Budget estimado: $43-58 por pantalla mensual

## 📚 RECURSOS

- [Documentación Arquitectura](./docs/ARQUITECTURA.md)
- [API Reference](./docs/API.md)
- [Progress Tracking](./docs/PROGRESS.md)
- [Anthropic Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

---

**Última actualización**: 2024-11-20

**Versión del documento**: 1.0.0