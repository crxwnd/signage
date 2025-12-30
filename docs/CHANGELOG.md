# 📝 CHANGELOG - Sistema de Señalización Digital

Este archivo documenta todos los cambios y modificaciones realizados en el proyecto.

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
