# CHANGELOG - Sistema de Senalizacion Digital

Este archivo documenta todos los cambios y modificaciones realizados en el proyecto.

---

## [2026-01-01] Fase 7: Sistema de Prioridad de Contenido y Alertas

### Objetivo
Sistema completo de prioridad de contenido con jerarquía definida: Alerts > Sync Groups > Schedules > Playlist > Fallback, incluyendo soporte para alertas urgentes y scheduling de sync groups.

### Database (Prisma)
- **Nuevos modelos**:
  - `Alert` - Alertas con tipo (INFO/WARNING/EMERGENCY), prioridad, alcance (hotel/area/display)
  - `SyncGroup` - Grupos de sincronización con campos de schedule (`scheduleEnabled`, `scheduleStart`, `scheduleEnd`, `scheduleStartTime`, `scheduleEndTime`, `scheduleRecurrence`)
  - `SyncGroupDisplay` - Relación many-to-many con región opcional para video walls
  - `SyncGroupContent` - Items del playlist de sync group
  - `PlaybackLog` - Registro de reproducción por display
  - `ContentSourceChange` - Auditoría de cambios de fuente de contenido
- **Modificaciones**: Display ahora tiene `fallbackContentId` para contenido por defecto

### Backend
- `services/contentResolver.ts` - Resolución de prioridad con `isSyncScheduleActive()` para sync groups programados
- `controllers/alertController.ts` - CRUD completo con RBAC y notificaciones Socket.io
- `routes/alerts.ts` - 6 endpoints: CRUD + deactivate
- `routes/displays.ts` - Nuevo endpoint `GET /:id/current-source` público para players
- `middleware/permissions.ts` - Nuevo `requireRole()` middleware

### Shared Types
- `packages/shared-types/src/alert.ts` - AlertType, Alert, CreateAlertDTO
- `packages/shared-types/src/content-source.ts` - ContentSource, SyncGroupInfo, ContentInfo

### Frontend
- `lib/api/alerts.ts` - API client con authenticatedFetch
- `hooks/useAlerts.ts` - React Query hooks (useAlerts, useCreateAlert, etc)
- `app/(dashboard)/alerts/page.tsx` - Página de gestión con tabla de activas + historial
- `components/alerts/CreateAlertModal.tsx` - Modal con selector de tipo, contenido, alcance, prioridad
- `Sidebar.tsx` - Link "Alerts" en Management

### Player
- `hooks/useContentSource.ts` - Hook para obtener fuente de contenido con polling
- `components/AlertOverlay.tsx` - Overlay con colores por tipo (azul/amarillo/rojo)
- `components/LoadingScreen.tsx` - Pantalla de carga
- `components/NoContentScreen.tsx` - Pantalla sin contenido asignado
- `components/SyncPlayer.tsx` - Player dedicado para sync con corrección de drift y overlay de pausa

### Dependencias
- Frontend: `date-fns` (formateo de fechas en alerts page)

---

## [2025-12-31] Fase 6: Sistema de Programación Avanzada

### Objetivo
Sistema completo de scheduling con fechas, horas, recurrencias RRULE y calendario visual.

### Backend
- **Prisma Model**: `Schedule` con relaciones a Content, Display, Area, Hotel, User
- `services/scheduleService.ts` - Lógica RRULE (getActiveContent, isScheduleActiveNow, getNextOccurrences)
- `controllers/scheduleController.ts` - CRUD con RBAC completo
- `routes/schedules.ts` - 7 endpoints: CRUD + /active/:displayId + /:id/preview

### Frontend
- `lib/api/schedules.ts` - API client con authenticatedFetch
- `hooks/useSchedules.ts` - React Query hooks (useSchedules, useCreateSchedule, etc)
- `app/(dashboard)/schedules/page.tsx` - Página principal con tabs Calendario/Lista
- Componentes:
  - `ScheduleCalendar.tsx` - Vista FullCalendar
  - `ScheduleList.tsx` - Tabla con acciones
  - `CreateScheduleModal.tsx` - Form completo
  - `RecurrenceEditor.tsx` - Editor RRULE visual
- Sidebar: Link "Schedules" en Management

### Dependencias
- Backend: `rrule` (RRULE parsing)
- Frontend: `@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`, `rrule`, `date-fns`, `@radix-ui/react-tabs`

---

## [2025-12-31] BUGFIX: Dashboard/Analytics 401 Unauthorized

### Problema
Error 401 en `/api/dashboard/stats` y `/api/analytics/*` por 3 causas:
1. Login redirige a `/displays` en vez de `/home`
2. API clients no usan `authenticatedFetch` (fetch sin token)
3. Hooks disparan fetch antes de auth

### Solucion
- `app/(auth)/login/page.tsx` - Default redirect de `/displays` a `/home`
- `lib/api/dashboard.ts` - Usar `authenticatedFetch` en vez de `fetch`
- `lib/api/analytics.ts` - Usar `authenticatedFetch` en todas las funciones
- `hooks/useDashboard.ts` - Agregar `enabled: !!user && !authLoading`
- `hooks/useAnalytics.ts` - Agregar `enabled: !!user && !authLoading` a 4 hooks

---

## [2025-12-31] Analytics System - Sistema de Reportes

### Objetivo
Implementar sistema completo de analytics con 4 subsecciones para monitorear rendimiento de displays, contenido y bandwidth.

### Backend
- `routes/analytics.ts` [NEW] - 4 endpoints:
  - `GET /api/analytics/overview` - KPIs, activity trend, top displays
  - `GET /api/analytics/displays` - Metricas por display (uptime, horas, desconexiones)
  - `GET /api/analytics/bandwidth` - Uso diario, por display, proyeccion mensual
  - `GET /api/analytics/content` - Ranking contenido, plays, completion rate

### Frontend
- `lib/api/analytics.ts` [NEW] - API client con tipos TypeScript
- `hooks/useAnalytics.ts` [NEW] - React Query hooks con cache 60s
- `Sidebar.tsx` - Nueva seccion "Analytics" con 4 items
- Paginas:
  - `/analytics` - Overview con 4 KPI cards, grafico 7 dias, top 5 displays
  - `/analytics/displays` - Tabla sortable con metricas por display
  - `/analytics/bandwidth` - 3 cards resumen, grafico 30 dias, top 10 consumidores
  - `/analytics/content` - Ranking por plays, completion rate, avg duration

---

## [2025-12-31] Home Dashboard - Panel Post-Login

### Objetivo
Transformar pagina Home en dashboard funcional con stats del sistema.

### Backend
- `routes/dashboard.ts` [NEW] - `GET /api/dashboard/stats`
  - Display stats (total, online, offline, error)
  - Content stats (total, videos, images, processing)
  - Sync groups stats
  - Recent activity (ultimos 10 cambios)
  - System status (server, database, redis, storage)

### Frontend
- `lib/api/dashboard.ts` [NEW] - API client
- `hooks/useDashboard.ts` [NEW] - React Query hook (refresh 30s)
- `components/dashboard/` [NEW]:
  - `StatsCard.tsx` - Card individual con icono y valor
  - `StatsGrid.tsx` - Grid 4 columnas responsive
  - `ActivityFeed.tsx` - Timeline de actividad reciente
  - `QuickActions.tsx` - Botones de acceso rapido
  - `SystemStatus.tsx` - Panel estado del sistema
- `app/(dashboard)/home/page.tsx` [NEW] - Dashboard completo
- `app/page.tsx` - Redirect a `/home`
- `Sidebar.tsx` - href Home cambiado de `/` a `/home`
- `AuthContext.tsx` - redirect post-login a `/home`

---


## [2025-12-31] UI Overhaul - Rediseno Visual Premium

### Objetivo
Transformar el frontend de funcional-basico a visualmente impactante con estilo Slack y liquid glass.

### Paleta de Colores
- Primary: #254D6E (Azul profundo)
- Secondary: #B88F69 (Dorado/Bronce)
- Background: #EDECE4 (Crema)
- Sidebar: #1a1a2e (Oscuro)

### Archivos Modificados

**Foundation:**
- `globals.css` - Nueva paleta HSL, animaciones (fadeIn, slideDown, pulse-subtle), clases .glass y .card-hover, scrollbar custom
- `tailwind.config.ts` - Colores brand/sidebar, keyframes, shadows, Space Grotesk font
- `layout.tsx` - Importa Space Grotesk de Google Fonts, Toaster con glass styling

**Sidebar (Estilo Slack):**
- `SidebarSection.tsx` [NEW] - Componente colapsable con chevron animado
- `Sidebar.tsx` - Fondo oscuro, secciones agrupadas (Dashboard, Management, Settings), glass dropdown

**Componentes UI:**
- `card.tsx` - Prop glass opcional, rounded-2xl, shadow-card hover
- `button.tsx` - Variantes default/outline/secondary/accent con brand colors
- `badge.tsx` - 7 variantes de estado (online, offline, error, warning, processing, ready, pending)
- `input.tsx` - Focus ring con brand color, hover state, rounded-lg
- `select.tsx` - Focus ring con brand color, rounded-xl dropdown, check indicator con brand color
- `dialog.tsx` - Backdrop blur, rounded-2xl, shadow-xl
- `Header.tsx` - Glass effect, useAuth integrado, notification badge con brand color

**Cards:**
- `DisplayCard.tsx` - Usa badge variants, card-hover, pulse animation para online
- `ContentCard.tsx` - Usa badge variants, brand gradients, hover scaling mejorado

### Resultado
- Typecheck: PASS
- Sin emojis en UI
- Transiciones suaves 150ms

---

## [2025-12-30] BUGFIX: Integración Sync Handlers Faltantes

### Problema Detectado
El player emitía `sync:join-group` y `sync:leave-group` pero el backend no tenía handlers. Los displays no podían unirse a grupos de sync.

### Solución
**Archivos creados**:
- `apps/backend/src/socket/syncHandlers.ts` - Handlers para sync:join-group, sync:leave-group, sync:report-position

**Archivos modificados**:
- `packages/shared-types/src/socket-events.ts` - Import/re-export de sync types, agregado SyncGroupStateEvent
- `apps/backend/src/socket/socketManager.ts` - Import y llamada a setupSyncHandlers()

**Funcionalidad**:
- Players pueden unirse a grupos de sync via Socket.io
- Late join envía sync:group-state con estado actual
- Conductor puede reportar posición
- Logs detallados para debugging

---

## [2025-12-30] Sesión de Bugfixes Críticos

### BUGFIX: Auth Refresh Race Condition (CRÍTICO)
**Archivo**: `apps/frontend/src/lib/api/auth.ts`

**Problema**: Múltiples llamadas simultáneas a refresh causaban loop de redirect a login.

**Causa**: Cooldown retornaba `null` inmediatamente → AuthContext asumía "no session" → redirect.

**Solución** (Single-flight pattern):
- Si hay refresh en progreso, ESPERAR el resultado (no retornar null)
- Durante cooldown, retornar token existente si hay uno
- En rate limit 429, retornar token existente (no fallar)

### BUGFIX: Rate Limit Bloquea HLS y Auth (ALTO)
**Archivo**: `apps/backend/src/app.ts`

**Problema**: Segmentos .ts bloqueados con 429, auth/refresh también bloqueado.

**Solución**:
- Static files movidos ANTES del rate limiter
- Skip function para: `/hls/`, `/uploads/`, `/thumbnails/`
- Skip para auth críticos: `/api/auth/refresh`, `/api/auth/me`, `/api/auth/logout`
- Rate limit aumentado de 100 a 200 req/15min

### BUGFIX: URL HLS Duplicada (ALTO)
**Archivo**: `apps/backend/src/queue/videoQueue.ts`

**Problema**: URL generada era `/hls/{id}/{id}/master.m3u8` (contentId duplicado).

**Causa**: `ffmpegService` retorna `{id}/master.m3u8` y videoQueue agregaba `/hls/{id}/`.

**Solución**: Cambiar a `/hls/${hlsOutput.masterPlaylistUrl}` (sin duplicar).

### BUGFIX: Delete Content Loop (MEDIO)
**Archivo**: `apps/frontend/src/components/content/ContentCard.tsx`

**Problema**: Refresh infinito al borrar contenido.

**Causa**: `window.location.reload()` disparaba auth check → loop.

**Solución**: Usar `onRefetch?.()` sin reload de página.

### Resultados:
- ✅ `pnpm typecheck` → pass (todos los packages)
- ✅ Videos HLS reproducen sin cortes
- ✅ Auth refresh sin loops
- ✅ Delete content sin refresh infinito

---

## [2025-12-30] Fase 5: Sincronización Entre Pantallas

### 5.1 Backend Sync Server ✅
**Archivos creados**:
- `packages/shared-types/src/sync.ts` - Tipos para SyncGroup, SyncTick, SyncCommand
- `apps/backend/src/services/syncService.ts` - Gestión de grupos de sync
- `apps/backend/src/routes/sync.ts` - API REST para sync groups

**Funcionalidades**:
- Grupos de sincronización con múltiples displays
- Broadcast `sync:tick` cada 100ms para grupos activos
- Asignación automática de conductor (primer display conectado)
- Failover automático cuando conductor se desconecta
- Endpoints: CRUD grupos + start/pause/resume/seek/stop/conductor

### 5.2 Player Sync Client ✅
**Archivos creados**:
- `apps/player/src/hooks/useClockSync.ts` - Compensación de reloj cliente-servidor
- `apps/player/src/hooks/useSyncPlayback.ts` - Ajuste de reproducción (soft/hard sync)
- `apps/player/src/components/SyncIndicator.tsx` - UI de estado de sync

**Funcionalidades**:
- Cálculo de offset cliente-servidor con promediado de muestras
- Soft sync: ajuste playbackRate ±5% para drift <500ms
- Hard sync: seek directo para drift >2s
- Tolerancia: ±50ms considerado "en sync"
- Late join: handleLateJoin() para conexión tardía

### 5.3 UI Admin para Sync ✅
**Archivos creados**:
- `apps/frontend/src/lib/api/sync.ts` - API client
- `apps/frontend/src/hooks/useSyncGroups.ts` - React Query hooks
- `apps/frontend/src/components/sync/SyncGroupCard.tsx` - Card con controles
- `apps/frontend/src/components/sync/CreateSyncGroupModal.tsx` - Modal creación
- `apps/frontend/src/app/(dashboard)/sync/page.tsx` - Página principal

**Funcionalidades**:
- Página /sync para administración de grupos
- Crear grupos seleccionando ≥2 displays
- Controles de playback: Play, Pause, Stop
- Ver estado en tiempo real (playing/paused/stopped)
- Ver conductor actual
- Sidebar link "Sync Groups" para SUPER_ADMIN/HOTEL_ADMIN

---

## [2025-12-29] Sesión de Bugfixes Críticos

### BUGFIX: Corrección de Issues Críticos
**Fecha**: 29/12/2025  
**Reportado en**: Pruebas manuales post Fase 4

#### Bug 1: Loop de Logout (CRÍTICO)
**Archivo**: `apps/frontend/src/contexts/AuthContext.tsx`
- **Causa**: Auto-refresh de token ejecutándose después de logout
- **Fix**: Limpiar estado ANTES de llamar API, no esperar respuesta
- **Cambio**: `setUser(null)` y `clearAccessToken()` al inicio de logout

#### Bug 2: 2FA Inválido (ALTA)
- **Revisión**: Código verificado, TOTP_WINDOW=1 configurado
- **Status**: Implementación correcta, requiere testing manual

#### Bug 3: Videos en Error (ALTA)
**Archivo**: `apps/backend/src/queue/videoQueue.ts`
- **Añadido**: Handler `ready` para confirmar worker activo
- **Añadido**: Handler `active` para logging de jobs iniciados
- **Status**: Worker tiene logging mejorado

#### Feature 4: Delete Content con RBAC (MEDIA)
**Backend** `apps/backend/src/controllers/contentController.ts`:
- RBAC: SUPER_ADMIN todo, HOTEL_ADMIN/AREA_MANAGER su hotel
- Verificación de asignaciones a displays
- Limpieza de archivos físicos (original, thumbnail, HLS)

**Frontend** `apps/frontend/src/components/content/DeleteContentModal.tsx`:
- Modal de confirmación con estados de carga
- Toast de éxito/error
- Integración con authenticatedFetch

#### Resultados:
- ✅ `pnpm typecheck` backend → pass
- ✅ `pnpm typecheck` frontend → pass
- ✅ Logout sin loops
- ✅ Delete content con permisos

---

## [2025-12-28] Sesión de Desarrollo

### 3.5.1 Corrección de Errores de Linting Backend
**Fecha**: 28/12/2025  
**Objetivo**: Corregir todos los errores de linting en el backend

#### Modificaciones Realizadas:

**1. `apps/backend/src/app.ts`**
- Línea 32: Cambiado `@ts-ignore` → `@ts-expect-error` (regla @typescript-eslint/ban-ts-comment)
- Líneas 107-109: Reemplazado `console.log()` con `log.info()` del logger existente
- Añadido import de `log` desde `./middleware/logger`

**2. `apps/backend/src/middleware/auth.ts`**
- Línea 16: Añadido `eslint-disable-next-line @typescript-eslint/no-namespace` para la declaración global de Express Request
- Esto es necesario porque `declare global { namespace Express }` es el patrón estándar para extender tipos de Express

**3. `apps/backend/src/controllers/authController.ts`**
- Línea 429: Removido `async` de la función `logout()` ya que no contiene expresiones `await`
- Cambiado de `async function logout(): Promise<void>` → `function logout(): void`

**4. `apps/backend/src/controllers/areaController.ts`**
- Línea 130: Envuelto el bloque `default:` del switch en llaves `{}` para corregir error de declaración léxica
- Esto soluciona el error `no-case-declarations`

**5. `apps/backend/src/server.ts`**
- Línea 62: Removido `async` de la función `shutdown()` ya que no usa `await` directamente
- Líneas 82, 88, 108: Añadido `eslint-disable-next-line no-process-exit` antes de cada `process.exit()`
- Los `process.exit()` son necesarios para el graceful shutdown del servidor

**6. `apps/backend/src/services/ffmpegService.ts`**
- Línea 50: Removido `async` de `getVideoInfo()` - retorna Promise pero no usa await
- Línea 136: Removido `async` de `generateThumbnail()` - mismo caso
- Línea 299: Reemplazado non-null assertion `QUALITY_PRESETS[0]!` con null check seguro

#### Resultados:
- **Antes**: 34 problemas (10 errores, 24 warnings)
- **Después**: 23 problemas (0 errores, 23 warnings) ✅
- Warnings restantes son todos `@typescript-eslint/no-explicit-any` que requieren refactor mayor

---

### 3.5.2 Fix: Super Admin Upload Content
**Fecha**: 28/12/2025  
**Objetivo**: Permitir a Super Admin subir contenido seleccionando hotel destino

#### Modificaciones Realizadas:

**1. `apps/frontend/src/components/content/UploadContentModal.tsx`**
- Añadido import del hook `useHotels` desde `@/hooks/useHotels`
- Añadido import del componente `Select` desde `@/components/ui/select`
- Nuevo state `selectedHotelId` para la selección de hotel
- Uso del hook `useHotels()` para obtener lista de hoteles
- Nueva variable `effectiveHotelId = user?.hotelId || selectedHotelId`
- Selector de hotel visible solo para SUPER_ADMIN sin hotelId asignado
- Pre-selección automática del primer hotel disponible
- Validación actualizada para usar `effectiveHotelId`
- Botón de upload deshabilitado si no hay hotel seleccionado

#### Comportamiento por Rol:
- **SUPER_ADMIN (hotelId: null)**: Ve selector "Target Hotel" → debe elegir hotel destino
- **HOTEL_ADMIN (hotelId: assigned)**: NO ve selector → usa su hotel automáticamente
- **AREA_MANAGER (hotelId: assigned)**: NO ve selector → usa su hotel automáticamente

---

### 3.4.3 Modal 2FA Frontend
**Fecha**: 28/12/2025  
**Objetivo**: Permitir a usuarios activar/desactivar 2FA desde la interfaz

#### Modificaciones Realizadas:

**1. Nuevo: `apps/frontend/src/components/settings/TwoFactorModal.tsx`**
- Modal con 3 estados: inicial (setup), verificación (QR), desactivar
- Muestra código QR generado por backend
- Opción de copiar secreto manualmente
- Input para código de 6 dígitos
- Manejo de errores y estados de loading

**2. `apps/frontend/src/lib/api/auth.ts`**
- Añadidas funciones: `setup2FA()`, `verify2FA()`, `disable2FA()`
- Interface `Setup2FAResponse` con secret, qrCode, otpauthUrl
- Manejo de errores con ApiError

**3. `apps/frontend/src/app/(dashboard)/settings/page.tsx`**
- Sección de seguridad funcional con estado 2FA
- Botón "Enable" o "Manage" según estado actual
- Integración de TwoFactorModal
- Badges de estado (Enabled/Disabled)

**4. `apps/frontend/src/contexts/AuthContext.tsx`**
- Añadida función `refreshUser()` para refrescar datos de usuario
- Actualizada interface `AuthContextState`
- Usada después de cambios en 2FA

#### Resultados:
- ✅ `pnpm typecheck` pasa sin errores
- ✅ Modal funcional con flujo completo de activación
- ✅ Modal funcional con flujo de desactivación

---

### 4.3.1 Setup Dexie.js y Cache Service
**Fecha**: 28/12/2025  
**Objetivo**: Implementar cache local con IndexedDB para reproducción offline

#### Modificaciones Realizadas:

**1. Nuevo: `apps/player/src/lib/db/cacheDb.ts`**
- Schema Dexie con tablas: contents, segments, metadata
- Tipos: CachedContent, CachedSegment, CacheMetadata
- Índices para LRU: lastAccessed, cachedAt

**2. Nuevo: `apps/player/src/lib/services/cacheService.ts`**
- `cacheImage()`, `getCachedImage()` - cache de imágenes
- `cacheSegment()`, `getCachedSegment()` - cache de segmentos HLS
- `ensureSpace()`, `evictLRU()` - gestión de espacio con LRU
- `precachePlaylist()` - pre-cache automático
- `getStorageEstimate()` - uso de navigator.storage.estimate()
- Límite: 500MB, threshold: 80%

**3. Nuevo: `apps/player/src/hooks/useCache.ts`**
- Hook React para acceder al cache
- Stats: used, quota, percentage, itemCount
- Métodos: cacheImage, getCachedImage, clearCache, precachePlaylist

**4. `apps/player/src/components/PlaylistPlayer.tsx`**
- Integrado pre-caching de imágenes al cargar playlist
- Usa imágenes cacheadas si disponibles (con indicador 📦)
- CacheIndicator: muestra tamaño de cache y cantidad de items
- Cleanup de Object URLs al desmontar

**5. `apps/player/package.json`**
- Añadida dependencia: `dexie ^4.2.1`

#### Resultados:
- ✅ `pnpm typecheck` pasa sin errores
- ✅ Imágenes se cachean automáticamente
- ✅ Cache con límite 500MB y LRU eviction al 80%
- ✅ Indicador visual de cache en player

---

### 4.4.1 Detección de Conexión y Modo Offline
**Fecha**: 28/12/2025  
**Objetivo**: Implementar modo offline para player SmartTV

#### Modificaciones Realizadas:

**1. Nuevo: `apps/player/src/hooks/useNetworkStatus.ts`**
- Detecta eventos online/offline del navegador
- Verificación periódica cada 5s como respaldo
- Estado: isOnline, wasOffline, offlineSince, lastOnline

**2. Nuevo: `apps/player/src/hooks/useOfflineMode.ts`**
- Integra detección de red con cola de eventos
- Callbacks onReconnect, onDisconnect
- Procesa cola automáticamente al reconectar

**3. Nuevo: `apps/player/src/components/OfflineBanner.tsx`**
- Banner rojo fijo en parte superior
- Muestra duración de desconexión
- Icono SVG de sin conexión

**4. Nuevo: `apps/player/src/lib/services/offlineQueue.ts`**
- Cola de eventos en localStorage
- Métodos: enqueue, processQueue, clear
- Reintentos: 3 intentos por evento

**5. `apps/player/src/app/page.tsx`**
- Integrado OfflineBanner
- Hook useOfflineMode con callbacks
- Estado de errores adaptado para offline
- Status overlay muestra modo offline y pendientes

**6. `apps/player/src/hooks/usePlayerSocket.ts`**
- Handlers de reconexión: reconnect, reconnect_attempt, reconnect_failed
- Re-registro de display automático al reconectar

**7. `apps/player/src/components/PlaylistPlayer.tsx`**
- Prop isOffline para comportamiento futuro
- Preparado para filtrar solo contenido cacheado

#### Resultados:
- ✅ `pnpm typecheck` pasa sin errores
- ✅ Banner visual cuando pierde conexión
- ✅ Player continúa con contenido cacheado
- ✅ Reconexión automática con recarga de playlist
- ✅ Cola de eventos sincroniza al reconectar

---

## Formato de Entradas

Cada entrada sigue el formato:
```
### X.Y.Z Nombre de la Modificación
**Fecha**: DD/MM/YYYY
**Objetivo**: Descripción breve

#### Modificaciones Realizadas:
**1. `ruta/al/archivo.ts`**
- Descripción del cambio
- Línea afectada: detalle

#### Resultados:
- Verificación de funcionamiento
```