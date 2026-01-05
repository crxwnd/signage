# Backend - Signage Digital System

Express + TypeScript + Prisma + PostgreSQL

## 📋 Requisitos Previos

- Node.js 20+
- pnpm 10.23.0
- Docker y Docker Compose
- PostgreSQL 15 (via Docker)

## 🚀 Setup Inicial

### 1. Instalar Dependencias

```bash
# Desde la raíz del proyecto
pnpm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` en la raíz del proyecto (ya debería existir).

```bash
# Verificar que existe
cat ../../.env | grep DATABASE_URL
```

La URL debe ser: `postgresql://signage:signage_dev@localhost:5432/signage`

### 3. Levantar Servicios Docker

```bash
# Desde la raíz del proyecto
docker compose up -d

# Verificar que los servicios están corriendo
docker ps
```

Deberías ver 3 contenedores:
- `signage-postgres` (PostgreSQL 15)
- `signage-redis` (Redis 7)
- `signage-minio` (MinIO)

### 4. Ejecutar Migraciones de Base de Datos

```bash
# Desde la raíz del proyecto
pnpm db:migrate --filter=backend

# O desde apps/backend
cd apps/backend
npx prisma migrate dev --name init
```

Esto creará:
- Directorio `prisma/migrations/` con la migración inicial
- Todas las tablas en PostgreSQL
- Prisma Client generado

### 5. Generar Prisma Client (si no se generó automáticamente)

```bash
# Desde la raíz
pnpm db:generate --filter=backend

# O desde apps/backend
npx prisma generate
```

### 6. Verificar Base de Datos

```bash
# Abrir Prisma Studio para inspeccionar la DB
pnpm db:studio --filter=backend
```

Prisma Studio abrirá en `http://localhost:5555`

### 7. Ejecutar Seed (Datos de Prueba)

```bash
pnpm db:seed --filter=backend
```

## 🔑 Credenciales de Desarrollo

Después de ejecutar el seed (`pnpm db:seed`), las siguientes cuentas están disponibles:

| Rol | Email | Password |
|-----|-------|----------|
| **Super Admin** | `admin@signage.com` | `Admin123!` |
| **Hotel Admin** | `admin@hotel.com` | `Hotel123!` |
| **Area Manager** | `manager@hotel.com` | `Manager123!` |

> ⚠️ Estas credenciales son solo para desarrollo. **Cambiar en producción.**

## 🗄️ Schema de Base de Datos

### Modelos

- **User**: Autenticación con 2FA, roles (SUPER_ADMIN, HOTEL_ADMIN, AREA_MANAGER)
- **Hotel**: Gestión de hoteles
- **Display**: Pantallas SmartTV con estado y pairing
- **Content**: Videos, imágenes, HTML con metadata
- **DisplayContent**: Relación many-to-many con scheduling

### Enums

- `UserRole`: SUPER_ADMIN, HOTEL_ADMIN, AREA_MANAGER
- `DisplayStatus`: ONLINE, OFFLINE, ERROR
- `ContentType`: VIDEO, IMAGE, HTML

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev                    # Iniciar servidor en modo watch

# Base de datos
pnpm db:push               # Push schema a DB (desarrollo rápido)
pnpm db:migrate            # Crear nueva migración
pnpm db:studio             # Abrir Prisma Studio
pnpm db:generate           # Generar Prisma Client
pnpm db:seed               # Ejecutar seed (cuando esté implementado)

# Build y producción
pnpm build                 # Compilar TypeScript
pnpm start                 # Iniciar servidor compilado

# Linting y Type Checking
pnpm lint                  # Ejecutar ESLint
pnpm typecheck             # Verificar tipos TypeScript
```

## 📊 Estructura de Directorios

```
apps/backend/
├── prisma/
│   ├── migrations/        # Migraciones de base de datos
│   ├── schema.prisma      # Schema de Prisma
│   └── seed.ts            # Script de seed (TODO)
├── src/
│   ├── routes/            # Express routes
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   ├── socket/            # Socket.io handlers
│   ├── jobs/              # BullMQ jobs
│   ├── utils/             # Utilidades
│   ├── config/            # Configuración
│   └── server.ts          # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 Troubleshooting

### Error: Can't reach database server

```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solución**: Asegúrate de que Docker está corriendo:

```bash
docker compose up -d
docker ps | grep postgres
```

### Error: Database does not exist

**Solución**: Ejecuta las migraciones:

```bash
pnpm db:migrate --filter=backend
```

### Error: Prisma Client no generado

**Solución**: Genera el cliente manualmente:

```bash
pnpm db:generate --filter=backend
```

## 📝 Próximos Pasos

1. ✅ Schema de Prisma definido
2. ⏳ Crear migración inicial (`pnpm db:migrate`)
3. ⏳ Implementar servidor Express básico
4. ⏳ Configurar Socket.io
5. ⏳ Crear endpoints REST básicos
6. ⏳ Implementar autenticación JWT + 2FA
7. ⏳ Configurar BullMQ para video processing

## 🔗 Enlaces Útiles

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js](https://expressjs.com/)
- [Socket.io](https://socket.io/docs/v4/)
- [TypeScript](https://www.typescriptlang.org/docs/)
