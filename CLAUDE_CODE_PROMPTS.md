# 🎯 GUÍA DE PROMPTS PARA CLAUDE CODE - SISTEMA DE SEÑALIZACIÓN DIGITAL

**Proyecto**: Sistema de Señalización Digital para Hoteles  
**Metodología**: Desarrollo Incremental sin Fallos  
**Créditos disponibles**: $184 USD

---

## 📋 ÍNDICE RÁPIDO

- [Fase 0: Preparación](#fase-0-preparación-1-día)
- [Fase 1: Fundación - Semana 1](#fase-1-fundación-semana-1-5-días)
  - [Día 1: Setup Monorepo](#día-1-setup-monorepo)
  - [Día 2: Tipos y Base de Datos](#día-2-tipos-compartidos-y-base-de-datos)
  - [Día 3: Backend Base](#día-3-backend-base)
  - [Día 4: Frontend Base](#día-4-frontend-base)
  - [Día 5: Integración](#día-5-integración-y-testing)
- [Fase 2: Features Core - Semanas 2-3](#fase-2-features-core-semanas-2-3)
- [Fase 3: Features Avanzadas](#fase-3-features-avanzadas-semanas-4-6)

---

## ⚠️ INSTRUCCIONES CRÍTICAS ANTES DE EMPEZAR

### Reglas de Oro para Usar Estos Prompts

1. **Copia y pega EXACTAMENTE** cada prompt en Claude Code
2. **NO modifiques** los prompts (están optimizados)
3. **Espera** a que Claude complete antes de siguiente prompt
4. **Revisa** el código generado ANTES de continuar
5. **Ejecuta checkpoints** al final de cada día
6. **Usa /clear** cada 30-40 minutos o cada 5-7 prompts
7. **Actualiza PROGRESS.md** después de cada tarea completada

### Workflow por Prompt

```
1. Copiar prompt → Pegarlo en Claude Code
2. Claude responde → Revisar código/plan
3. ¿Está correcto?
   ✅ SÍ → Continuar con siguiente prompt
   ❌ NO → Dar feedback específico y repetir
4. Marcar tarea en PROGRESS.md
5. Commit si es punto de checkpoint
```

### Cuándo Hacer /clear

- Cada 30-40 minutos de conversación
- Después de completar un día completo
- Si Claude empieza a confundirse o repetirse
- Después de commits importantes

**IMPORTANTE**: Después de /clear, siempre empieza con:

```
"Lee CLAUDE.md y PROGRESS.md. Estamos en [fase/día actual]. Continuemos con..."
```

---

## FASE 0: PREPARACIÓN (1 día)

### Objetivo

Crear archivos de contexto y estructura inicial antes de cualquier código.

---

### PROMPT 0.1 - Test de Conexión

```
Hola! Vamos a trabajar juntos en un proyecto de sistema de señalización digital para hoteles.

INSTRUCCIÓN IMPORTANTE: NO escribas código todavía. Solo confirma que puedes:
1. Leer el archivo CLAUDE.md en la raíz del proyecto
2. Leer el archivo docs/PROGRESS.md
3. Leer el archivo docs/ARQUITECTURA.md (si existe)

Lee estos archivos y responde con un resumen muy breve (3-4 líneas) de lo que entiendes del proyecto.
```

**Validación**:

- [ ] Claude puede leer CLAUDE.md
- [ ] Claude entiende que es un sistema de señalización digital
- [ ] Claude NO generó código

**Si falla**: Verifica que los archivos estén en el repositorio correctamente.

---

### PROMPT 0.2 - Preparación Mental

```
Perfecto. Ahora quiero que te prepares mentalmente para trabajar de forma incremental.

REGLAS QUE DEBES SEGUIR SIEMPRE:
1. NUNCA generes todo el código de una vez
2. SIEMPRE pregunta si algo no está claro
3. SIEMPRE sigue los patrones del CLAUDE.md
4. Implementa UNA cosa a la vez (un componente, un endpoint)
5. Espera mi aprobación antes de continuar

¿Entiendes y aceptas estas reglas? Solo responde "Sí" o plantea dudas.
```

**Validación**:

- [ ] Claude acepta trabajar incrementalmente
- [ ] Claude entiende que debe esperar aprobación

---

## FASE 1: FUNDACIÓN - SEMANA 1 (5 días)

### Objetivo

Setup del monorepo, configuración base, primera feature end-to-end.

---

## DÍA 1: SETUP MONOREPO

### PROMPT 1.1 - Exploración (SIN CÓDIGO)

```
FASE: Exploración del proyecto (NO generes código todavía)

Lee cuidadosamente estos archivos:
- CLAUDE.md (completo)
- docs/ARQUITECTURA.md (si existe)
- docs/PROGRESS.md

Después de leerlos, responde SOLO estas preguntas sin generar código:

1. ¿Cuál es el stack tecnológico obligatorio?
2. ¿Qué tipo de monorepo vamos a usar?
3. ¿Cuántos "apps" y cuántos "packages" tendremos inicialmente?
4. ¿Cuál es el objetivo del proyecto?

Tu respuesta debe ser en bullets, máximo 10 líneas totales.
```

**Validación**:

- [ ] Claude menciona: Turborepo, React, Node.js, TypeScript, Socket.io
- [ ] Claude identifica: 2-3 apps (frontend, backend, player)
- [ ] Claude identifica: 3-4 packages (shared-types, ui, config, utils)
- [ ] Claude NO generó código

**Si falla**: Claude no leyó bien CLAUDE.md. Haz /clear y repite PROMPT 0.1.

---

### PROMPT 1.2 - Plan Detallado de Estructura

```
FASE: Planificación - Estructura del Monorepo

Ahora usa "think harder" (razonamiento profundo) para crear un PLAN DETALLADO de la estructura del monorepo.

El plan debe incluir:
1. Estructura completa de carpetas (árbol de directorios)
2. Packages necesarios en cada carpeta
3. Dependencias principales por app/package
4. Configuración de Turborepo (workspace, pipelines básicos)
5. Scripts necesarios en package.json raíz

IMPORTANTE:
- Solo genera el plan en formato markdown
- NO escribas código real todavía
- Sé específico con versiones (React 18, Node 20, etc.)
- Sigue EXACTAMENTE lo indicado en CLAUDE.md

Formato esperado:
```

## Estructura de Carpetas

[árbol de directorios aquí]

## Dependencias por Package

[lista detallada]

## Configuración de Turborepo

[explicación]

## Scripts de package.json raíz

[lista de scripts]

```

**Validación antes de continuar**:
- [ ] Plan incluye estructura completa de carpetas
- [ ] Menciona Turborepo, pnpm workspaces
- [ ] Versiones específicas de dependencias
- [ ] Scripts de dev, build, test, lint

**CHECKPOINT**: Revisar el plan completamente. Si algo no se ve bien, dar feedback específico antes de continuar.

---

### PROMPT 1.3 - Implementar Estructura Base

```

FASE: Implementación - Crear estructura del monorepo

Ahora SÍ vamos a crear la estructura física del proyecto siguiendo tu plan.

Crea:

1. Estructura de carpetas exactamente como planeaste
2. package.json raíz con workspaces de pnpm
3. turbo.json con configuración básica
4. .gitignore apropiado para monorepo Node.js
5. .env.example con variables necesarias

Después de crear, ejecuta:

```bash
pnpm install
```

Y confirma que no hay errores.

REGLA IMPORTANTE: Crea TODO de una sola vez en este caso ya que es solo estructura sin lógica.

```

**Validación**:
- [ ] Estructura de carpetas creada
- [ ] package.json raíz existe con workspaces
- [ ] turbo.json existe y es válido
- [ ] `pnpm install` se ejecuta sin errores

**Posibles errores**:
- Si falla `pnpm install`: Verificar sintaxis de package.json
- Si Turborepo no reconoce workspaces: Verificar turbo.json

**COMMIT 1.1**: `chore: initialize monorepo structure`

---

### PROMPT 1.4 - Configuración TypeScript

```

FASE: Implementación - Configuración TypeScript

Configura TypeScript para el monorepo:

1. Crea tsconfig.json en la raíz (base config)
2. Crea tsconfig.json en cada app (frontend, backend)
3. Crea tsconfig.json en packages/shared-types
4. Configura path aliases (@shared-types, @/components, etc.)

REQUISITOS CRÍTICOS (de CLAUDE.md):

- strict: true SIEMPRE
- noImplicitAny: true
- strictNullChecks: true
- esModuleInterop: true
- skipLibCheck: true

Después de crear, ejecuta:

```bash
pnpm typecheck
```

Y confirma que no hay errores.

```

**Validación**:
- [ ] tsconfig.json en raíz y cada app/package
- [ ] Modo strict habilitado
- [ ] Path aliases configurados
- [ ] `pnpm typecheck` pasa sin errores

**COMMIT 1.2**: `chore: configure typescript`

---

### PROMPT 1.5 - ESLint y Prettier

```

FASE: Implementación - Linting y Formatting

Configura ESLint y Prettier:

1. Crea packages/config/eslint con configs compartidas
2. Crea packages/config/prettier con config compartida
3. Configura reglas específicas para:
   - React (frontend)
   - Node.js (backend)
   - TypeScript (todos)
4. Agrega scripts en package.json raíz:
   - pnpm lint
   - pnpm format

Usa estas reglas base:

- ESLint: plugin:@typescript-eslint/recommended
- React: plugin:react/recommended, plugin:react-hooks/recommended
- Prettier: semi: true, singleQuote: true, trailingComma: 'es5'

Después de crear, ejecuta:

```bash
pnpm lint
pnpm format
```

```

**Validación**:
- [ ] ESLint y Prettier configurados
- [ ] Configs en packages/config
- [ ] `pnpm lint` funciona
- [ ] `pnpm format` funciona (puede no hacer nada si código está formateado)

**COMMIT 1.3**: `chore: configure linting and formatting`

---

### CHECKPOINT DÍA 1

Antes de continuar al Día 2, verifica:

```

CHECKPOINT - Fin del Día 1

Ejecuta estos comandos y confirma que todos pasan:

```bash
pnpm install          # ✅ Sin errores
pnpm typecheck        # ✅ Pasa
pnpm lint             # ✅ Pasa (o solo warnings menores)
ls -la apps/          # ✅ Ve frontend/ y backend/
ls -la packages/      # ✅ Ve shared-types/, config/
```

Verifica manualmente:

- [ ] Estructura de carpetas completa
- [ ] package.json raíz con workspaces
- [ ] turbo.json existe
- [ ] TypeScript configs en cada app
- [ ] ESLint y Prettier funcionando

Si TODO está ✅, actualiza docs/PROGRESS.md:

- Marca Día 1 como completo
- Pon fecha de completado
- Anota cualquier issue encontrado

LUEGO haz:

```bash
git add .
git commit -m "feat: monorepo foundation complete (Day 1)"
git push
```

```

**Si algo falla**: NO continúes al Día 2. Arregla primero.

**Uso de créditos estimado Día 1**: ~$5-8 USD

---

## DÍA 2: TIPOS COMPARTIDOS Y BASE DE DATOS

### PROMPT 2.1 - Setup PostgreSQL y Prisma

```

FASE: Implementación - Base de datos

Vamos a configurar PostgreSQL y Prisma.

1. Crea docker-compose.yml en la raíz con:
   - PostgreSQL 15
   - Redis 7
   - pgAdmin (opcional, para debugging)

2. En apps/backend, instala y configura Prisma:

   ```bash
   cd apps/backend
   pnpm add prisma @prisma/client
   pnpm add -D prisma
   npx prisma init
   ```

3. Configura .env con:
   - DATABASE_URL para PostgreSQL
   - REDIS_URL para Redis
   - Variables de entorno necesarias

4. Inicia los servicios:
   ```bash
   docker-compose up -d
   ```

IMPORTANTE: No crees el schema todavía, solo la infraestructura.

```

**Validación**:
- [ ] docker-compose.yml existe y es válido
- [ ] PostgreSQL corriendo: `docker ps` muestra contenedor
- [ ] Redis corriendo: `docker ps` muestra contenedor
- [ ] Prisma inicializado en backend
- [ ] .env existe con DATABASE_URL

**COMMIT 2.1**: `chore: setup database infrastructure`

---

### PROMPT 2.2 - Schema Prisma

```

FASE: Implementación - Prisma Schema

Crea el schema de Prisma en apps/backend/prisma/schema.prisma

Modelos necesarios (de CLAUDE.md y docs/ARQUITECTURA.md):

1. User
   - id, email, password, name
   - role (enum: SUPER_ADMIN, HOTEL_ADMIN, AREA_MANAGER)
   - hotelId (opcional, solo para HOTEL_ADMIN y AREA_MANAGER)
   - twoFactorSecret, twoFactorEnabled
   - timestamps

2. Hotel
   - id, name, address
   - displayCount (computed)
   - timestamps

3. Display
   - id, name, location, status (enum: ONLINE, OFFLINE, ERROR)
   - hotelId, areaId (opcional)
   - lastSeen, deviceInfo (JSON)
   - pairingCode, pairedAt
   - timestamps

4. Content
   - id, title, type (enum: VIDEO, IMAGE, HTML)
   - url, duration, fileSize
   - hotelId
   - timestamps

5. DisplayContent (relación muchos-a-muchos)
   - displayId, contentId
   - order, startTime, endTime
   - timestamps

IMPORTANTE:

- Agrega índices para queries frecuentes
- Usa @unique donde corresponda
- Agrega @@map para nombres de tabla en snake_case si prefieres

```

**Validación**:
- [ ] schema.prisma existe con los 5 modelos
- [ ] Relaciones correctas (User-Hotel, Display-Hotel, etc.)
- [ ] Enums definidos correctamente
- [ ] Sin errores de sintaxis Prisma

**PROMPT 2.2.1 - Migración**:
```

Ahora crea la primera migración:

```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate
```

Confirma que se ejecutó sin errores.

```

**Validación**:
- [ ] Migración creada en prisma/migrations/
- [ ] `npx prisma migrate dev` exitoso
- [ ] Prisma Client generado

**COMMIT 2.2**: `feat: create prisma schema and initial migration`

---

### PROMPT 2.3 - Tipos TypeScript Compartidos

```

FASE: Implementación - Shared Types

En packages/shared-types, crea las interfaces TypeScript que frontend y backend compartirán.

Archivos a crear:

1. src/models/display.ts
   - Interface Display (sync con Prisma model)
   - Type DisplayStatus
   - Type DisplayFilter

2. src/models/content.ts
   - Interface Content
   - Type ContentType
   - Interface Playlist

3. src/models/user.ts
   - Interface User (sin password)
   - Type UserRole
   - Interface LoginRequest/Response

4. src/socket-events.ts (MUY IMPORTANTE)
   - Client-to-server events
   - Server-to-client events
   - Tipos de payloads para cada evento

5. src/api.ts
   - API request types
   - API response wrapper type
   - Pagination types

6. src/index.ts
   - Export todo desde un solo punto

Sigue las convenciones de CLAUDE.md:

- Interfaces para objetos
- Types para unions
- Nombres en PascalCase

```

**Validación**:
- [ ] Archivos creados en packages/shared-types/src/
- [ ] Types exportados desde index.ts
- [ ] `pnpm typecheck` pasa sin errores
- [ ] Frontend y backend pueden importar: `import type { Display } from '@shared-types'`

**COMMIT 2.3**: `feat: create shared typescript types`

---

### PROMPT 2.4 - Verificación de Importación

```

FASE: Validación - Test de tipos compartidos

Crea dos archivos de prueba para verificar que shared-types funciona:

1. apps/backend/src/test-types.ts

   ```typescript
   import type { Display, User } from '@shared-types';

   const testDisplay: Display = {
     // ... completar con datos de prueba
   };

   console.log('Backend puede importar tipos ✅');
   ```

2. apps/frontend/src/test-types.ts

   ```typescript
   import type { Display, Content } from '@shared-types';

   const testDisplay: Display = {
     // ... completar con datos de prueba
   };

   console.log('Frontend puede importar tipos ✅');
   ```

Ejecuta:

```bash
pnpm typecheck
```

Si pasa, puedes borrar los archivos test-types.ts (fueron solo para validar).

```

**Validación**:
- [ ] Archivos de test creados
- [ ] `pnpm typecheck` pasa
- [ ] No hay errores de importación

**COMMIT 2.4**: `test: verify shared types work across packages`

---

### CHECKPOINT DÍA 2

```

CHECKPOINT - Fin del Día 2

Verifica:

```bash
docker ps                           # ✅ PostgreSQL y Redis corriendo
docker exec -it [postgres] psql -U postgres -d signage -c "\\dt"
                                    # ✅ Ve las 5 tablas creadas
cd apps/backend && npx prisma studio # ✅ Prisma Studio abre
pnpm typecheck                      # ✅ Pasa sin errores
```

Checklist:

- [ ] PostgreSQL operando correctamente
- [ ] Prisma Studio accesible
- [ ] Migración inicial aplicada
- [ ] Shared types funcionando en ambos apps
- [ ] Sin errores de TypeScript

Actualiza PROGRESS.md y commitea:

```bash
git add .
git commit -m "feat: database and shared types complete (Day 2)"
git push
```

Si PROGRESS.md no ha empezado, dile a Claude:
"Actualiza docs/PROGRESS.md marcando Day 2 como completo con fecha de hoy."

```

**Uso de créditos estimado Día 2**: ~$6-10 USD

---

## DÍA 3: BACKEND BASE

### PROMPT 3.1 - Express Server Básico

```

FASE: Implementación - Backend API Base

En apps/backend, crea la estructura base del servidor Express:

1. src/server.ts (entry point)
2. src/app.ts (Express app configuration)
3. src/config/index.ts (environment variables)
4. src/middleware/errorHandler.ts
5. src/middleware/logger.ts
6. src/routes/health.ts (health check endpoint)

El servidor debe:

- Correr en puerto 3001 (configurable por env)
- Tener endpoint GET /health que responda:
  ```json
  {
    "status": "ok",
    "timestamp": "2024-11-20T...",
    "uptime": 123.45,
    "database": "connected"
  }
  ```
- Logging básico de requests
- Manejo de errores global

Instala dependencias necesarias:

```bash
cd apps/backend
pnpm add express cors dotenv
pnpm add -D @types/express @types/cors @types/node nodemon ts-node
```

Agrega script en package.json:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

```

**Validación**:
- [ ] Backend estructura creada
- [ ] `pnpm dev` inicia servidor sin errores
- [ ] Servidor escucha en puerto 3001
- [ ] `curl http://localhost:3001/health` responde correctamente

**COMMIT 3.1**: `feat: create express server foundation`

---

### PROMPT 3.2 - Socket.io Server

```

FASE: Implementación - Socket.io Server

Integra Socket.io con el servidor Express:

1. Instala Socket.io:

   ```bash
   cd apps/backend
   pnpm add socket.io
   ```

2. Crea src/socket/socketManager.ts con:
   - Configuración de Socket.io
   - Manejo de conexión/desconexión
   - Logging de eventos
   - Tipos de socket-events de @shared-types

3. Integra Socket.io en app.ts (compartiendo servidor HTTP con Express)

4. Crea un evento de prueba:
   - Cliente emite: 'test-message'
   - Servidor responde: 'test-response'

El servidor debe:

- Aceptar conexiones en mismo puerto que Express (3001)
- CORS configurado para http://localhost:3000 (frontend)
- Logging de cada conexión/desconexión
- Usar tipos de @shared-types/socket-events

IMPORTANTE: No implementes Redis adapter todavía, eso viene después.

````

**Validación**:
- [ ] Socket.io configurado
- [ ] Servidor inicia sin errores
- [ ] Logs muestran "Socket.io initialized"

**Para probar manualmente**:
1. En terminal: `cd apps/backend && pnpm dev`
2. Abrir navegador en http://localhost:3001
3. Consola del navegador:
   ```javascript
   const socket = io('http://localhost:3001');
   socket.on('connect', () => console.log('Conectado!'));
   socket.emit('test-message', { data: 'hola' });
   socket.on('test-response', (data) => console.log('Respuesta:', data));
````

**COMMIT 3.2**: `feat: integrate socket.io server`

---

### PROMPT 3.3 - Redis y Socket.io Adapter

````
FASE: Implementación - Redis Adapter para Socket.io

Configura Redis adapter para permitir escalabilidad horizontal de Socket.io:

1. Instala dependencias:
   ```bash
   cd apps/backend
   pnpm add @socket.io/redis-adapter ioredis
````

2. Modifica src/socket/socketManager.ts para:
   - Conectar a Redis
   - Configurar adapter
   - Manejar errores de conexión Redis

3. Actualiza .env con REDIS_URL si no existe

4. Test de cluster:
   - Inicia 2 instancias del backend en puertos diferentes
   - Conecta cliente Socket.io a una instancia
   - Emite broadcast desde la otra
   - Verifica que ambas instancias se comunican vía Redis

El código debe:

- Fallar gracefully si Redis no está disponible (log warning pero no crash)
- Reconectar automáticamente si Redis se desconecta

```

**Validación**:
- [ ] Redis adapter configurado
- [ ] Backend inicia sin errores
- [ ] Logs muestran "Redis adapter connected"
- [ ] Test de cluster funciona (opcional para este checkpoint)

**COMMIT 3.3**: `feat: add redis adapter for socket.io clustering`

---

### PROMPT 3.4 - Middleware de Seguridad

```

FASE: Implementación - Security Middleware

Agrega middleware de seguridad esencial:

1. Instala dependencias:

   ```bash
   cd apps/backend
   pnpm add helmet express-rate-limit
   ```

2. Crea src/middleware/security.ts con:
   - Helmet configurado (headers de seguridad)
   - Rate limiting básico (100 req/15min por IP)
   - CORS más restrictivo (solo origen del frontend)

3. Crea src/middleware/validation.ts con:
   - Helper para validar request body con Zod
   - Middleware genérico de validación

4. Aplica middleware en app.ts en orden correcto:
   - Helmet (primero)
   - CORS
   - Rate limiting
   - Body parser
   - Morgan (logging)
   - Routes
   - Error handler (último)

Ejemplo de uso de validación:

```typescript
import { z } from 'zod';
import { validateBody } from '@/middleware/validation';

const createDisplaySchema = z.object({
  name: z.string().min(3),
  location: z.string(),
});

router.post(
  '/displays',
  validateBody(createDisplaySchema),
  createDisplayHandler
);
```

```

**Validación**:
- [ ] Middleware de seguridad configurado
- [ ] `pnpm dev` inicia sin errores
- [ ] Headers de seguridad presentes en responses (usa curl -I)
- [ ] Rate limiting funciona (hacer 100+ requests rápidas)

**COMMIT 3.4**: `feat: add security middleware (helmet, rate-limit, validation)`

---

### CHECKPOINT DÍA 3

```

CHECKPOINT - Fin del Día 3

Verifica que el backend está funcionando completamente:

```bash
cd apps/backend
pnpm dev               # ✅ Inicia sin errores
```

En otra terminal:

```bash
curl http://localhost:3001/health
# ✅ Responde con status "ok"

curl -I http://localhost:3001/health
# ✅ Ve headers de Helmet (X-Content-Type-Options, etc.)
```

Test de Socket.io:

1. Backend corriendo
2. Abrir navegador console
3. Pegar:
   ```javascript
   const socket = io('http://localhost:3001');
   socket.on('connect', () => console.log('✅ Conectado'));
   ```
4. Ver log en terminal del backend confirmando conexión

Checklist:

- [ ] Express server funcionando en 3001
- [ ] /health endpoint responde correctamente
- [ ] Socket.io acepta conexiones
- [ ] Redis adapter conectado
- [ ] Middleware de seguridad activo
- [ ] Logs claros en consola

Actualiza PROGRESS.md y commitea:

```bash
git add .
git commit -m "feat: backend foundation complete (Day 3)"
git push
```

```

**Uso de créditos estimado Día 3**: ~$8-12 USD

---

## DÍA 4: FRONTEND BASE

### PROMPT 4.1 - Next.js Setup

```

FASE: Implementación - Frontend con Next.js 14

Configura Next.js 14 con App Router en apps/frontend:

1. Si no existe, inicializa Next.js:

   ```bash
   cd apps
   npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --no-import-alias
   ```

2. Instala dependencias adicionales:

   ```bash
   cd frontend
   pnpm add @shared-types
   ```

3. Configura next.config.js para:
   - Permitir conexiones WebSocket
   - Configurar path aliases
   - Optimizaciones de producción

4. Crea estructura de carpetas:

   ```
   app/
   ├── layout.tsx           # Root layout
   ├── page.tsx             # Home page
   ├── globals.css          # Global styles
   ├── (dashboard)/         # Dashboard routes group
   │   ├── layout.tsx
   │   └── displays/
   │       └── page.tsx
   └── api/                 # API routes (si necesitas)

   components/
   ├── ui/                  # shadcn/ui components
   └── layout/              # Layout components
       ├── Sidebar.tsx
       └── Header.tsx

   lib/
   ├── utils.ts
   └── socket.ts            # Socket.io client setup
   ```

5. Configura Tailwind CSS si no está:
   - tailwind.config.js con custom colors y fonts
   - globals.css con @tailwind directives

6. Script de desarrollo:
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start"
     }
   }
   ```

```

**Validación**:
- [ ] Next.js configurado en apps/frontend
- [ ] `pnpm dev` inicia sin errores
- [ ] Página en http://localhost:3000 carga
- [ ] Tailwind funcionando (prueba con clases)

**COMMIT 4.1**: `feat: setup next.js 14 with app router`

---

### PROMPT 4.2 - shadcn/ui Setup

```

FASE: Implementación - shadcn/ui Component Library

Configura shadcn/ui para componentes de UI:

1. Inicializa shadcn/ui:

   ```bash
   cd apps/frontend
   npx shadcn-ui@latest init
   ```

   Selecciona:
   - TypeScript: Yes
   - Style: Default
   - Base color: Slate
   - CSS variables: Yes

2. Instala componentes básicos que usaremos:

   ```bash
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add badge
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add toast
   npx shadcn-ui@latest add dropdown-menu
   ```

3. Crea components/ui/index.ts para exports centralizados

4. Prueba un componente en app/page.tsx:

   ```tsx
   import { Button, Card, Badge } from '@/components/ui';

   export default function Home() {
     return (
       <div className="p-8">
         <Card className="p-6">
           <h1 className="mb-4 text-2xl font-bold">
             Sistema de Señalización Digital
           </h1>
           <Badge variant="success">Online</Badge>
           <Button className="mt-4">Test Button</Button>
         </Card>
       </div>
     );
   }
   ```

```

**Validación**:
- [ ] shadcn/ui inicializado
- [ ] Componentes instalados en components/ui/
- [ ] Página de prueba muestra componentes correctamente
- [ ] Estilos de shadcn/ui aplicados

**COMMIT 4.2**: `feat: setup shadcn/ui component library`

---

### PROMPT 4.3 - Layout Base con Sidebar

```

FASE: Implementación - Dashboard Layout

Crea el layout principal del dashboard con sidebar:

1. components/layout/Sidebar.tsx:
   - Navigation links (Home, Displays, Content, Users)
   - Íconos (usa lucide-react)
   - Active state para ruta actual
   - Responsive (collapsible en mobile)
   - Estilos con Tailwind

2. components/layout/Header.tsx:
   - Logo/título del sistema
   - User menu dropdown (mock por ahora)
   - Notifications badge (mock)
   - Mobile menu toggle button

3. app/(dashboard)/layout.tsx:
   - Wrapper que usa Sidebar + Header
   - Grid layout responsive
   - Content area con padding apropiado

4. Actualiza app/(dashboard)/displays/page.tsx:
   - Página simple que muestra "Displays Page"
   - Usa Card de shadcn/ui

Estilos importantes (de CLAUDE.md):

- Sistema de espaciado de 8px (p-2, p-4, p-6, p-8)
- NO usar fuentes genéricas (Inter, Roboto)
- Colores consistentes con theme de shadcn/ui

```

**Validación**:
- [ ] Layout renderiza correctamente
- [ ] Sidebar muestra navigation links
- [ ] Header con logo y user menu
- [ ] Página /displays accesible
- [ ] Responsive (prueba en mobile viewport)
- [ ] Sin errores de consola

**COMMIT 4.3**: `feat: create dashboard layout with sidebar and header`

---

### PROMPT 4.4 - Socket.io Client

```

FASE: Implementación - Socket.io Client Integration

Configura Socket.io client para conexión con backend:

1. Instala Socket.io client:

   ```bash
   cd apps/frontend
   pnpm add socket.io-client
   ```

2. Crea lib/socket.ts:
   - Inicialización de socket con configuración
   - Auto-reconnection
   - Logging de conexión/desconexión
   - Typed events usando @shared-types

3. Crea providers/SocketProvider.tsx:
   - React Context para socket
   - Hook useSocket() para acceder al socket
   - Connection status indicator

4. Integra SocketProvider en app/layout.tsx:

   ```tsx
   import { SocketProvider } from '@/providers/SocketProvider';

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <SocketProvider>{children}</SocketProvider>
         </body>
       </html>
     );
   }
   ```

5. Crea components/ConnectionStatus.tsx:
   - Badge que muestra estado de conexión Socket.io
   - Verde: Connected
   - Amarillo: Connecting
   - Rojo: Disconnected

6. Agrega ConnectionStatus al Header

Ejemplo de uso del hook:

```tsx
'use client';

import { useSocket } from '@/providers/SocketProvider';

export function MyComponent() {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('test-event', (data) => {
      console.log('Received:', data);
    });

    return () => {
      socket.off('test-event');
    };
  }, [socket]);

  return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
}
```

```

**Validación**:
- [ ] Socket.io client configurado
- [ ] Frontend conecta con backend (puerto 3001)
- [ ] ConnectionStatus badge muestra "Connected" (verde)
- [ ] Logs en backend muestran nueva conexión
- [ ] useSocket() hook funciona

**Test manual**:
1. Backend corriendo en 3001
2. Frontend corriendo en 3000
3. Abrir http://localhost:3000
4. Ver badge de conexión en header (debe ser verde)
5. En backend terminal: ver log "Socket client connected: [id]"

**COMMIT 4.4**: `feat: integrate socket.io client with connection status`

---

### CHECKPOINT DÍA 4

```

CHECKPOINT - Fin del Día 4

Verifica que frontend está completamente funcional:

1. Backend corriendo:

   ```bash
   cd apps/backend && pnpm dev
   ```

2. Frontend corriendo:

   ```bash
   cd apps/frontend && pnpm dev
   ```

3. Abre http://localhost:3000

Checklist visual:

- [ ] Página carga sin errores
- [ ] Layout renderiza (sidebar + header + content)
- [ ] Navigation funciona (/displays muestra página)
- [ ] ConnectionStatus badge es VERDE (conectado)
- [ ] shadcn/ui components se ven bien

Checklist técnico:

```bash
cd apps/frontend
pnpm build              # ✅ Build exitoso
pnpm typecheck          # ✅ Sin errores de tipos
pnpm lint               # ✅ Sin errores de lint
```

Test de integración básico:

1. Frontend conectado
2. Backend muestra log de nueva conexión
3. Desconecta backend (Ctrl+C)
4. Badge en frontend cambia a ROJO
5. Reinicia backend
6. Badge cambia a VERDE automáticamente

Si TODO funciona ✅:

```bash
git add .
git commit -m "feat: frontend foundation complete (Day 4)"
git push
```

Actualiza PROGRESS.md marcando Día 4 completo.

```

**Uso de créditos estimado Día 4**: ~$10-15 USD

---

## DÍA 5: INTEGRACIÓN Y TESTING

### PROMPT 5.1 - Primera Feature End-to-End

```

FASE: Implementación - Primera Feature Integrada

Vamos a crear la primera feature completa: Lista de displays (mock data por ahora).

BACKEND (API REST):

1. apps/backend/src/routes/displays.ts:

   ```typescript
   // GET /api/displays
   // POST /api/displays (validar con Zod)
   // GET /api/displays/:id
   // PATCH /api/displays/:id
   // DELETE /api/displays/:id
   ```

2. apps/backend/src/controllers/displaysController.ts:
   - Implementar handlers para cada endpoint
   - Usar Prisma para DB operations
   - Response format de CLAUDE.md:
     ```typescript
     {
       success: boolean;
       data?: T;
       error?: string;
       timestamp: string;
     }
     ```

3. apps/backend/src/services/displaysService.ts:
   - Lógica de negocio separada del controller
   - CRUD operations con Prisma

4. Integra rutas en app.ts:

   ```typescript
   app.use('/api/displays', displaysRoutes);
   ```

5. Test manual con curl:
   ```bash
   curl http://localhost:3001/api/displays
   ```

FRONTEND (Lista con datos de API):

1. app/(dashboard)/displays/page.tsx:
   - Fetch datos de GET /api/displays
   - Mostrar lista de displays
   - Loading state
   - Error state

2. components/displays/DisplayCard.tsx:
   - Card para cada display
   - Props: display object de tipo Display
   - Badge para status (online/offline/error)
   - Información: name, location, lastSeen

3. lib/api/displays.ts:
   - Funciones para llamar API: getDisplays(), createDisplay(), etc.
   - Manejo de errores
   - TypeScript con tipos de @shared-types

Esta tarea es más grande, así que tómala en dos partes si es necesario:

- Parte A: Backend API completo
- Parte B: Frontend conectado al API

IMPORTANTE: Usa datos reales de la DB (crea algunos displays manualmente con Prisma Studio si es necesario).

```

**Validación Parte A (Backend)**:
- [ ] 5 endpoints creados y funcionando
- [ ] `curl http://localhost:3001/api/displays` responde con array de displays
- [ ] POST crea display en DB
- [ ] Validación Zod funciona (probar con datos inválidos)

**Validación Parte B (Frontend)**:
- [ ] Página /displays muestra lista de displays
- [ ] DisplayCard renderiza correctamente
- [ ] Si no hay displays, muestra mensaje apropiado
- [ ] Loading state funciona
- [ ] Error handling funciona (apaga backend y prueba)

**COMMIT 5.1**: `feat: first end-to-end feature - displays CRUD`

---

### PROMPT 5.2 - Socket.io Event para Displays

```

FASE: Implementación - Real-time Display Updates

Agrega eventos Socket.io para actualizaciones en tiempo real de displays:

BACKEND:

1. Cuando se crea/actualiza/elimina un display en la API, emitir evento:

   ```typescript
   // En displaysController.ts después de operación exitosa
   import { io } from '@/socket/socketManager';

   io.emit('display-created', { display });
   io.emit('display-updated', { display });
   io.emit('display-deleted', { displayId });
   ```

2. Usar tipos de @shared-types/socket-events

FRONTEND:

1. En app/(dashboard)/displays/page.tsx, escuchar eventos:

   ```typescript
   useEffect(() => {
     if (!socket) return;

     socket.on('display-created', (data) => {
       // Agregar nuevo display a la lista
     });

     socket.on('display-updated', (data) => {
       // Actualizar display en la lista
     });

     socket.on('display-deleted', (data) => {
       // Remover display de la lista
     });

     return () => {
       socket.off('display-created');
       socket.off('display-updated');
       socket.off('display-deleted');
     };
   }, [socket]);
   ```

2. Agrega toast notification cuando hay cambios:

   ```typescript
   import { toast } from '@/components/ui/use-toast';

   socket.on('display-created', (data) => {
     toast({
       title: 'Display created',
       description: `${data.display.name} is now online`,
     });
   });
   ```

TEST:

1. Abre frontend en http://localhost:3000/displays
2. Abre Prisma Studio en otra ventana
3. Crea un nuevo display en Prisma Studio
4. Frontend debe mostrar el nuevo display INMEDIATAMENTE sin refresh
5. Debe aparecer toast notification

```

**Validación**:
- [ ] Backend emite eventos cuando cambian displays
- [ ] Frontend escucha eventos correctamente
- [ ] Lista se actualiza en tiempo real sin refresh
- [ ] Toast notifications aparecen

**Test**:
1. Frontend abierto en /displays
2. Crear display vía Prisma Studio
3. Ver nuevo display aparecer instantáneamente
4. Ver toast "Display created"

**COMMIT 5.2**: `feat: add real-time display updates via socket.io`

---

### PROMPT 5.3 - Testing Setup

```

FASE: Implementación - Testing Infrastructure

Configura testing para el proyecto:

VITEST SETUP:

1. Instala Vitest en ambos apps:

   ```bash
   cd apps/backend
   pnpm add -D vitest @vitest/ui

   cd apps/frontend
   pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
   ```

2. Crea vitest.config.ts en cada app

3. Agrega scripts en package.json:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

UNIT TESTS (Backend):

1. apps/backend/src/services/displaysService.test.ts:
   - Test de createDisplay()
   - Test de getDisplays()
   - Mock de Prisma

2. apps/backend/src/utils/helpers.test.ts (si tienes helpers):
   - Tests de funciones puras

UNIT TESTS (Frontend):

1. components/displays/DisplayCard.test.tsx:
   - Render test
   - Props test
   - Status badge colors test

PLAYWRIGHT SETUP:

1. Instala Playwright en frontend:

   ```bash
   cd apps/frontend
   pnpm add -D @playwright/test
   npx playwright install
   ```

2. playwright.config.ts con configuración

3. tests/e2e/displays.spec.ts:
   - Test de navegación a /displays
   - Test de que lista de displays renderiza
   - Test básico de UI elements

IMPORTANTE: Solo crea tests básicos, no completos. Es solo para tener la infraestructura lista.

```

**Validación**:
- [ ] Vitest configurado en backend y frontend
- [ ] `pnpm test` funciona en ambos apps
- [ ] Al menos 1 unit test pasa en backend
- [ ] Al menos 1 unit test pasa en frontend
- [ ] Playwright instalado
- [ ] `pnpm test:e2e` ejecuta test básico

**COMMIT 5.3**: `test: setup vitest and playwright testing infrastructure`

---

### PROMPT 5.4 - Docker y CI/CD

```

FASE: Implementación - Docker y GitLab CI

Finaliza el setup de DevOps:

DOCKER:

1. Dockerfile.dev para backend:
   - Node 20 Alpine
   - Install dependencies
   - Expose 3001
   - CMD para dev mode

2. Dockerfile.dev para frontend:
   - Node 20 Alpine
   - Install dependencies
   - Expose 3000
   - CMD para dev mode

3. Actualiza docker-compose.yml para incluir:
   - PostgreSQL
   - Redis
   - Backend service
   - Frontend service
   - Networks apropiadas

4. .dockerignore para excluir node_modules, dist, etc.

GITLAB CI/CD:

1. .gitlab-ci.yml con stages:
   - lint: ESLint en todo el monorepo
   - typecheck: TypeScript en todo el monorepo
   - test: Vitest en backend y frontend
   - build: Build de producción

2. Cache de node_modules para velocidad

3. Artifacts de coverage reports

Ejemplo mínimo de .gitlab-ci.yml:

```yaml
stages:
  - lint
  - test
  - build

cache:
  key: '$CI_COMMIT_REF_SLUG'
  paths:
    - node_modules/
    - .pnpm-store/

lint:
  stage: lint
  image: node:20-alpine
  script:
    - corepack enable
    - pnpm install
    - pnpm lint

typecheck:
  stage: lint
  image: node:20-alpine
  script:
    - corepack enable
    - pnpm install
    - pnpm typecheck

test:
  stage: test
  image: node:20-alpine
  script:
    - corepack enable
    - pnpm install
    - pnpm test --run

build:
  stage: build
  image: node:20-alpine
  script:
    - corepack enable
    - pnpm install
    - pnpm build
  artifacts:
    paths:
      - apps/*/dist
```

IMPORTANTE: No implementes deployment todavía, solo build.

```

**Validación**:
- [ ] docker-compose up inicia todos los servicios
- [ ] Backend accesible desde host
- [ ] Frontend accesible desde host
- [ ] .gitlab-ci.yml es sintácticamente válido
- [ ] Pipeline corre en GitLab (o simula localmente)

**COMMIT 5.4**: `chore: setup docker and gitlab ci/cd pipeline`

---

### CHECKPOINT SEMANA 1 COMPLETA

```

🎉 CHECKPOINT FINAL - SEMANA 1 COMPLETA 🎉

Antes de continuar a Semana 2, valida COMPLETAMENTE el sistema:

TESTS DE SISTEMA COMPLETO:

1. Levantar todo con Docker:

   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

   Espera que todos los servicios inicien:
   - ✅ PostgreSQL healthy
   - ✅ Redis healthy
   - ✅ Backend listening on 3001
   - ✅ Frontend listening on 3000

2. Test de Backend:

   ```bash
   curl http://localhost:3001/health
   # Debe responder status "ok"

   curl http://localhost:3001/api/displays
   # Debe responder con array de displays
   ```

3. Test de Frontend:
   - Abrir http://localhost:3000
   - Navegar a /displays
   - Ver lista de displays
   - ConnectionStatus badge debe estar VERDE

4. Test de Integración End-to-End:
   - Frontend abierto en /displays
   - Abrir Prisma Studio: `cd apps/backend && npx prisma studio`
   - Crear nuevo display en Prisma Studio
   - INMEDIATAMENTE debe aparecer en frontend SIN refresh
   - Toast notification debe aparecer

5. Test de Reconexión:
   - Frontend abierto
   - Detener backend: `docker-compose stop backend`
   - Badge debe cambiar a ROJO
   - Reiniciar backend: `docker-compose start backend`
   - Badge debe cambiar a VERDE automáticamente

6. Test de CI/CD:
   ```bash
   pnpm lint         # ✅ Pasa
   pnpm typecheck    # ✅ Pasa
   pnpm test --run   # ✅ Pasa
   pnpm build        # ✅ Pasa
   ```

CHECKLIST FINAL SEMANA 1:

Infraestructura:

- [ ] Monorepo con Turborepo funcionando
- [ ] TypeScript strict mode en todos los packages
- [ ] ESLint y Prettier configurados
- [ ] Docker Compose con todos los servicios
- [ ] GitLab CI pipeline configurado

Backend:

- [ ] Express server en 3001
- [ ] Socket.io con Redis adapter
- [ ] PostgreSQL + Prisma
- [ ] Endpoints /api/displays CRUD
- [ ] Middleware de seguridad
- [ ] Logging con Winston (si implementado)

Frontend:

- [ ] Next.js 14 App Router en 3000
- [ ] shadcn/ui components
- [ ] Layout con Sidebar + Header
- [ ] Socket.io client conectado
- [ ] Página /displays funcional

Integración:

- [ ] Frontend ↔ Backend vía API REST
- [ ] Frontend ↔ Backend vía Socket.io
- [ ] Actualizaciones en tiempo real funcionando
- [ ] Toast notifications
- [ ] Error handling

Testing:

- [ ] Vitest configurado
- [ ] Al menos 3 unit tests pasando
- [ ] Playwright configurado
- [ ] Al menos 1 E2E test básico

Si TODO está ✅:

```bash
git add .
git commit -m "feat: week 1 foundation complete 🎉"
git tag v0.1.0-week1
git push origin main --tags
```

Actualiza docs/PROGRESS.md:

- Marca Semana 1 completa
- Anota créditos usados hasta ahora
- Lista issues encontrados
- Nota mejoras sugeridas

---

📊 MÉTRICAS ESPERADAS SEMANA 1:

- Tiempo invertido: ~30-40 horas
- Créditos Claude Code usados: ~$35-50 USD
- Commits realizados: 15-20
- Features completadas: 1 (Displays CRUD)
- Tests escritos: 5-10
- Líneas de código: ~3,000-5,000

SIGUIENTE: Semana 2 - Features Core (Gestión avanzada de Displays, Contenidos, Streaming)

```

**Uso de créditos estimado Día 5**: ~$12-18 USD
**Total Semana 1**: ~$41-63 USD de los $184 disponibles

---

## FASE 2: FEATURES CORE (Semanas 2-3)

**NOTA**: Los prompts de Semana 2 y 3 están simplificados aquí. Una vez completada Semana 1, solicita los prompts detallados de Semana 2.

### SEMANA 2: GESTIÓN AVANZADA DE DISPLAYS

**Objetivo**: Completar el módulo de displays con features avanzadas.

#### Día 6: Filtros y Búsqueda
- [ ] Filtros por estado, hotel, área
- [ ] Búsqueda por nombre
- [ ] Paginación en backend
- [ ] UI de filtros en frontend

#### Día 7: Formularios de Creación/Edición
- [ ] Modal para crear display
- [ ] Form con react-hook-form + Zod
- [ ] Edición inline
- [ ] Validación en tiempo real

#### Día 8: Acciones Masivas
- [ ] Selección múltiple
- [ ] Acciones batch (delete, change area, etc.)
- [ ] Confirmación antes de acción destructiva

#### Día 9: Detalles de Display
- [ ] Página de detalle (/displays/[id])
- [ ] Historial de actividad
- [ ] Estadísticas de uptime
- [ ] Logs de conexión

#### Día 10: Conductor Manager Completo
- [ ] Lógica completa de conductor/worker
- [ ] Elección de nuevo conductor si falla
- [ ] Heartbeat monitoring
- [ ] Dashboard de sincronización

### SEMANA 3: CONTENIDOS Y STREAMING

#### Día 11-12: Sistema de Contenidos
- [ ] CRUD de contenidos
- [ ] Upload de archivos a MinIO
- [ ] Preview de contenidos
- [ ] Metadata automática

#### Día 13-14: Streaming HLS
- [ ] FFmpeg transcoding con BullMQ
- [ ] HLS.js player component
- [ ] Adaptive bitrate
- [ ] Cache con Service Worker

#### Día 15: Playlists
- [ ] Crear playlists
- [ ] Drag-and-drop ordering
- [ ] Programación temporal
- [ ] Asignar a displays

---

## TIPS CRÍTICOS DURANTE EL DESARROLLO

### Uso Eficiente de Créditos

**Prompts que ahorran créditos**:
- ✅ Específicos y concisos
- ✅ Una tarea a la vez
- ✅ Incluyen contexto mínimo necesario

**Prompts que desperdician créditos**:
- ❌ "Explícame toda la arquitectura de nuevo"
- ❌ Repetir información que ya di
- ❌ Múltiples tareas en un prompt

### Cuándo Hacer /clear

**Señales de que necesitas /clear**:
- Claude repite información
- Claude olvida convenciones de CLAUDE.md
- Respuestas genéricas o incorrectas
- Después de 30-40 minutos

**Después de /clear**:
```

"Lee CLAUDE.md y PROGRESS.md.

Estamos en: Semana [X], Día [Y], Tarea [Z]

Lo que hemos completado hasta ahora:

- [lista breve de features completadas]

Ahora continuemos con: [próxima tarea específica]"

````

### Manejo de Errores Comunes

**Error: "Cannot find module '@shared-types'"**
- Verificar que shared-types está en packages/
- Verificar que package.json raíz tiene workspaces
- Ejecutar `pnpm install` en raíz

**Error: Socket.io no conecta**
- Verificar CORS en backend
- Verificar puerto correcto (3001)
- Ver logs en ambos lados

**Error: Prisma client not generated**
- Ejecutar `npx prisma generate` en apps/backend
- Verificar DATABASE_URL en .env

### Debugging Tips

**Ver logs de Socket.io**:
```typescript
// Backend
socket.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.onAny((event, ...args) => {
    console.log('📥', event, args);
  });
});

// Frontend
socket.onAny((event, ...args) => {
  console.log('📤', event, args);
});
````

**Ver queries de Prisma**:

```typescript
// apps/backend/src/config/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## SIGUIENTE FASE

Una vez completada la Semana 1, solicita:

```
"Hola! Completamos exitosamente la Semana 1.

Por favor proporciona los prompts detallados para Semana 2:
- Días 6-10
- Gestión avanzada de Displays

Lee PROGRESS.md para ver nuestro avance actual."
```

---

**Última actualización**: 2024-11-20  
**Versión**: 1.0.0
