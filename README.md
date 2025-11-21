# 🎬 Sistema de Señalización Digital para Hoteles

Sistema completo de señalización digital para gestionar 100+ pantallas SmartTV en hoteles con sincronización en tiempo real, streaming HLS, y gestión jerárquica de usuarios.

## 🚀 Quick Start

```bash
# Instalar dependencias
pnpm install

# Levantar servicios (PostgreSQL, Redis, MinIO)
docker-compose up -d

# Setup inicial de base de datos
cd apps/backend
npx prisma migrate dev
cd ../..

# Desarrollo
pnpm dev                # Todos los servicios
pnpm dev:frontend       # Solo frontend (localhost:3000)
pnpm dev:backend        # Solo backend (localhost:3001)
```

## 📋 Prerequisitos

- **Node.js**: 20 LTS o superior
- **pnpm**: 8.x o superior (`npm install -g pnpm`)
- **Docker**: Para servicios (PostgreSQL, Redis, MinIO)
- **Git**: Para control de versiones

## 🏗️ Arquitectura

### Stack Tecnológico

**Frontend**:

- React 18 + TypeScript 5.2+
- Next.js 14 con App Router
- Tailwind CSS + shadcn/ui
- Socket.io-client para tiempo real
- HLS.js para video streaming
- MobX para state management
- Dexie.js para IndexedDB

**Backend**:

- Node.js 20 + TypeScript 5.2+
- Express.js para API REST
- Socket.io para WebSocket
- PostgreSQL 15 + Prisma ORM
- Redis 7 para cache y sessions
- BullMQ para job queues
- FFmpeg para video processing
- MinIO para object storage

**DevOps**:

- Turborepo para monorepo
- Docker para desarrollo y producción
- GitLab CI/CD para pipelines
- PM2 para process management
- Prometheus + Grafana para monitoring

### Estructura del Proyecto

```
signage/
├── apps/
│   ├── frontend/           # Next.js App Router
│   ├── backend/            # Express API + Socket.io
│   └── player/             # Lightweight player para SmartTVs
├── packages/
│   ├── shared-types/       # Tipos TypeScript compartidos
│   ├── ui/                 # Componentes React compartidos
│   ├── config/             # Configuraciones compartidas
│   └── utils/              # Utilidades compartidas
├── docs/
│   ├── ARQUITECTURA.md
│   ├── PROGRESS.md
│   └── API.md
├── CLAUDE.md               # Contexto para Claude Code
├── CLAUDE_CODE_PROMPTS.md  # Guía de desarrollo con IA
└── README.md               # Este archivo
```

## 🎯 Features Principales

### Gestión de Pantallas

- ✅ CRUD completo de displays
- ✅ Estado en tiempo real (online/offline/error)
- ✅ Sincronización exacta entre 100+ pantallas (50-200ms)
- ✅ Sistema de pairing con código único
- ✅ Monitoreo de salud y uptime
- ✅ Agrupación por hotel y área

### Sistema de Contenidos

- 🔄 Upload de videos (hasta 3GB+)
- 🔄 Transcoding automático a HLS
- 🔄 Streaming adaptativo
- 🔄 Caché local en SmartTVs (hasta 5GB)
- 🔄 Preview de contenidos
- 🔄 Biblioteca de medios

### Playlists y Programación

- 🔄 Crear playlists mixtas (videos + imágenes + HTML)
- 🔄 Drag-and-drop ordering
- 🔄 Programación temporal
- 🔄 Asignación a grupos de displays
- 🔄 Actualización en tiempo real (<10 segundos)

### Usuarios y Permisos

- 🔄 Super Admin → Admin Hotel → Area Manager
- 🔄 Autenticación JWT + 2FA
- 🔄 Permisos granulares por recurso
- 🔄 Logs de auditoría

### Monitoreo y Analytics

- 🔄 Dashboard de estado en tiempo real
- 🔄 Estadísticas de reproducción
- 🔄 Uptime por pantalla
- 🔄 Alertas automáticas
- 🔄 Métricas de rendimiento

**Leyenda**: ✅ Completado | 🔄 En desarrollo | ⏸️ Pendiente

## 🔧 Comandos Disponibles

### Desarrollo

```bash
pnpm dev              # Todos los servicios
pnpm dev:frontend     # Solo frontend
pnpm dev:backend      # Solo backend

pnpm build            # Build de producción
pnpm start            # Start producción
```

### Testing

```bash
pnpm test             # Tests con Vitest
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
pnpm test:e2e         # E2E con Playwright
```

### Calidad de Código

```bash
pnpm lint             # ESLint
pnpm lint:fix         # Auto-fix
pnpm format           # Prettier
pnpm typecheck        # TypeScript
```

### Base de Datos

```bash
pnpm db:push          # Push schema (desarrollo)
pnpm db:migrate       # Crear migration
pnpm db:studio        # Abrir Prisma Studio
pnpm db:seed          # Seed data
pnpm db:reset         # Reset completo
```

### Docker

```bash
pnpm docker:up        # Levantar servicios
pnpm docker:down      # Detener servicios
pnpm docker:logs      # Ver logs
pnpm docker:clean     # Limpiar volúmenes
```

## 🌍 Variables de Entorno

Crea un archivo `.env` en la raíz y en `apps/backend/.env` con:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/signage
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_2FA_SECRET=your-2fa-secret-key

# Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

Ver `.env.example` para lista completa.

## 📚 Documentación

- **[ARQUITECTURA.md](./docs/ARQUITECTURA.md)**: Decisiones técnicas y arquitectura del sistema
- **[CLAUDE.md](./CLAUDE.md)**: Contexto completo para Claude Code
- **[CLAUDE_CODE_PROMPTS.md](./CLAUDE_CODE_PROMPTS.md)**: Guía paso a paso de desarrollo con IA
- **[PROGRESS.md](./docs/PROGRESS.md)**: Tracking de avance del proyecto
- **[API.md](./docs/API.md)**: Documentación de API REST

## 🚧 Estado del Proyecto

### Fase Actual: Semana 1 - Fundación

**Completado**:

- ✅ Setup de monorepo con Turborepo
- ✅ Configuración TypeScript strict
- ✅ ESLint y Prettier
- ✅ PostgreSQL + Prisma + Migrations
- ✅ Express server con Socket.io
- ✅ Redis adapter para Socket.io clustering
- ✅ Next.js 14 + App Router
- ✅ shadcn/ui component library
- ✅ Layout con Sidebar + Header
- ✅ Socket.io client con auto-reconnection
- ✅ Primera feature end-to-end (Displays CRUD)
- ✅ Real-time updates con Socket.io
- ✅ Testing setup (Vitest + Playwright)
- ✅ Docker Compose
- ✅ GitLab CI/CD pipeline

**Próximos pasos**: Ver [PROGRESS.md](./docs/PROGRESS.md)

## 🧪 Testing

El proyecto mantiene 70%+ de coverage de código con tests en tres niveles:

### Unit Tests (Vitest)

```bash
# Ejecutar todos los unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Integration Tests

Tests de API endpoints y servicios que interactúan con DB.

### End-to-End Tests (Playwright)

```bash
# Ejecutar E2E tests
pnpm test:e2e

# Con UI
pnpm test:e2e:ui

# Específico
pnpm test:e2e tests/e2e/displays.spec.ts
```

## 🔒 Seguridad

- **JWT Tokens**: Access tokens con expiración corta (15 min)
- **Refresh Tokens**: En httpOnly cookies
- **2FA**: TOTP con otplib
- **Rate Limiting**: 100 req/15min por IP
- **CORS**: Configurado restrictivamente
- **Helmet.js**: Headers de seguridad
- **Input Validation**: Zod en todos los endpoints
- **SQL Injection**: Prevenido con Prisma
- **XSS**: Prevenido con sanitización
- **Passwords**: Hasheados con bcrypt (12 rounds)

## 📊 Monitoreo

### Métricas Clave (Prometheus)

- Conexiones WebSocket activas
- Tasa de desconexión de displays
- Latencia de API (p50, p95, p99)
- Estado de reproducción por dispositivo
- Uso de almacenamiento
- Queue length de BullMQ

### Grafana Dashboards

- System Health
- Display Status
- Video Processing
- API Performance

## 🤝 Desarrollo con Claude Code

Este proyecto está optimizado para desarrollo asistido por IA con Claude Code.

**Antes de empezar**:

1. Lee [CLAUDE.md](./CLAUDE.md) completamente
2. Sigue [CLAUDE_CODE_PROMPTS.md](./CLAUDE_CODE_PROMPTS.md) paso a paso
3. Actualiza [PROGRESS.md](./docs/PROGRESS.md) después de cada tarea

**Workflow recomendado**:

1. Explorar (sin código)
2. Planificar (con "think harder")
3. Implementar (componente/endpoint a la vez)
4. Validar (tests + manual)
5. Commit

## 📦 Deployment

### Desarrollo Local

```bash
docker-compose up
pnpm dev
```

### Producción (Docker)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Producción (Manual)

```bash
pnpm build
pm2 start ecosystem.config.js
```

Ver [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) para guía completa.

## 🐛 Issues Conocidos

Ver [PROGRESS.md](./docs/PROGRESS.md) sección "Issues Encontrados".

## 📝 Convenciones de Código

### Git Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

[optional body]
[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Ejemplo**:

```
feat(displays): add real-time status updates

- Integrate Socket.io events
- Add toast notifications
- Update DisplayCard component

Closes #123
```

### TypeScript

- **Strict mode**: SIEMPRE activado
- **No `any`**: Usar `unknown` si necesario
- **Interfaces** para props, **types** para unions
- **Import types**: `import type { ... }`

### React

- **Solo funcionales**: No clases
- **Naming**: PascalCase para componentes, camelCase para funciones
- **Server Components**: Por defecto, `'use client'` solo cuando necesario

Ver [CLAUDE.md](./CLAUDE.md) para guía completa.

## 📄 Licencia

Propietario - Hotel XYZ

## 👥 Equipo

- **Arquitectura**: Basada en investigación exhaustiva de mejores prácticas
- **Desarrollo**: Asistido por Claude Code
- **Documentación**: Generada automáticamente

## 🆘 Soporte

Para reportar bugs o solicitar features:

1. Verifica [PROGRESS.md](./docs/PROGRESS.md) primero
2. Crea un issue en GitLab con template apropiado
3. Incluye steps to reproduce y logs relevantes

---

**Última actualización**: 2024-11-20  
**Versión**: 1.0.0  
**Estado**: En desarrollo activo 🚀
