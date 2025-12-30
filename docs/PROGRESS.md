# 📊 ROADMAP DEL PROYECTO - Sistema de Señalización Digital

**Proyecto**: Sistema de Señalización Digital para Hoteles  
**Última actualización**: 30/12/2025  
**Estado global**: ~65% completado

---

## 📋 RESUMEN EJECUTIVO

| Área | Estado | Prioridad |
|------|--------|-----------|
| Infraestructura Base | ✅ 95% | - |
| Procesamiento Video (FFmpeg/BullMQ) | ✅ 100% | - |
| Backend RBAC | ✅ 95% | ✅ COMPLETADO |
| Frontend Admin | ✅ 90% | ✅ CASI COMPLETO |
| Player SmartTV | ✅ 95% | ✅ COMPLETADO |
| Sincronización Pantallas | ❌ 0% | 🔴 CRÍTICA |
| Storage MinIO | ❌ 0% | 🟡 MEDIA |

---

## ✅ COMPLETADO (Fases 0-2 Legacy)

<details>
<summary>Ver historial completado</summary>

### Fase 0: Preparación ✅
- Archivos de contexto (CLAUDE.md, ARQUITECTURA.md)
- Monorepo Turborepo + pnpm
- TypeScript strict mode
- ESLint + Prettier

### Fase 1: Fundación ✅
- Express backend + Socket.io
- Next.js 14 frontend + Tailwind + shadcn/ui
- PostgreSQL + Prisma schema
- Redis adapter para Socket.io
- Docker compose (PostgreSQL, Redis)
- GitLab CI/CD básico

### Fase 2: Features Core ✅
- CRUD Displays (API + Frontend)
- CRUD Content con upload
- Transcodificación HLS (FFmpeg + BullMQ)
- Thumbnails automáticos
- Playlists básicas (DisplayContent)
- Socket.io eventos tiempo real
- Autenticación JWT + Refresh tokens
- 2FA backend (TOTP)

</details>

---

## 🚀 FASES PENDIENTES

### FASE 3: SEGURIDAD Y RBAC COMPLETO
**Duración estimada**: 8-10 días  
**Prioridad**: 🔴 CRÍTICA  
**Objetivo**: Asegurar todas las APIs y diferenciar acceso por rol

#### 3.0 Frontend - Gestión de Áreas (1 día) ✅ COMPLETADO
- [x] **3.0.1** Página `/areas`
  - [x] Grid de AreaCards con nombre, descripción, counts
  - [x] Botón "Nueva Área" (solo HOTEL_ADMIN+)
  - [x] Filtrado por hotel (para SUPER_ADMIN)
  
- [x] **3.0.2** Modales CRUD
  - [x] `CreateAreaModal` - crear nueva área
  - [x] `EditAreaModal` - editar nombre/descripción
  - [x] Confirmación de eliminación

- [x] **3.0.3** Sidebar
  - [x] Agregar link "Áreas" en navegación
  - [x] Icono apropiado (Layers)

#### 3.1 Backend - Proteger APIs (2-3 días) ✅ COMPLETADO
- [x] **3.1.1** Proteger rutas de Displays
  - [x] `router.use(authenticate)` en displays.ts
  - [x] Filtrado por hotelId/areaId según rol en controller
  
- [x] **3.1.2** Proteger rutas de Content
  - [x] `router.use(authenticate)` en content.ts
  - [x] Filtrado por hotelId en controller

- [x] **3.1.3** Helpers RBAC (nuevo)
  - [x] `middleware/permissions.ts` con getHotelFilter, getDisplayFilter, canAccessDisplay
  - [x] Filtrar contenido por `hotelId`
  - [x] Mismo patrón RBAC que displays

- [x] **3.1.4** Proteger rutas de DisplayContent (Playlists)
  - [x] Validar permisos sobre display destino
  - [x] Validar permisos sobre contenido asignado
  - [x] AREA_MANAGER no puede modificar (solo ver)

#### 3.2 Frontend - Diferenciación por Rol (2-3 días) ✅ COMPLETADO
- [x] **3.2.1** Sidebar condicional
  - [x] Ocultar "Hotels" para non-SUPER_ADMIN
  - [x] Ocultar "Areas"/"Users" para AREA_MANAGER
  - [x] Badge con rol de usuario
  - [x] Navegación filtrada por `requiredRoles`

- [x] **3.2.2** RoleGate component
  - [x] `RoleGate` para renderizado condicional
  - [x] `useCanManage()` hook
  - [x] `useIsSuperAdmin()` hook

- [x] **3.2.3** Protección de rutas frontend
  - [x] `/areas` → redirect si AREA_MANAGER
  - [x] Botones CRUD ocultos si no tiene permiso

#### 3.3 Testing RBAC (1 día)
- [x] Tests de integración por cada rol
- [x] Verificar que AREA_MANAGER no puede acceder a otro hotel
- [x] Verificar bypass de SUPER_ADMIN

  #### 3.4 Frontend - Gestión de Usuarios (2 días) ✅
  - [x] **3.4.1** Página `/users`
    - [x] Tabla de usuarios con rol, hotel, área
    - [x] Solo visible para HOTEL_ADMIN+ 

  - [x] **3.4.2** CRUD Usuarios
    - [x] Backend: `routes/users.ts` + `controllers/usersController.ts` con RBAC
    - [x] Backend: `routes/hotels.ts` + `controllers/hotelsController.ts` (GET /api/hotels)
    - [x] Frontend: API client, React Query hooks (`useUsers`, `useHotels`)
    - [x] Crear usuario con rol asignado (selector de hotel para SUPER_ADMIN)
    - [x] Editar rol/hotel/área de usuario
    - [x] Eliminar usuario (no puede eliminarse a sí mismo)

  - [x] **3.4.3** 2FA Modal ✅ COMPLETADO
    - [x] Modal para activar/desactivar 2FA
    - [x] Mostrar QR code para escanear
    - [x] Input para código de verificación
    - [x] Funciones API: setup2FA, verify2FA, disable2FA
    - [x] Integrado en página Settings

#### 3.5 Mantenimiento y Bugfixes (1 día) ✅ COMPLETADO
- [x] **3.5.1** Corrección de Errores de Linting Backend
  - [x] `app.ts`: @ts-expect-error, console.log → log.info
  - [x] `auth.ts`: eslint-disable para namespace
  - [x] `authController.ts`: remove async sin await
  - [x] `areaController.ts`: lexical declaration en case block
  - [x] `server.ts`: eslint-disable para process.exit
  - [x] `ffmpegService.ts`: remove async, fix non-null assertion
  - [x] **Resultado**: 0 errores, 23 warnings (solo no-explicit-any)

- [x] **3.5.2** Fix: Super Admin Upload Content
  - [x] Selector de hotel para SUPER_ADMIN en UploadContentModal
  - [x] Uso del hook `useHotels` existente
  - [x] Pre-selección del primer hotel disponible
  - [x] Validación con `effectiveHotelId`

  **Checkpoint Fase 3**: ✅ **COMPLETADO**
  - [x] Página `/areas` funcional con CRUD
  - [x] Ninguna API accesible sin token válido
  - [x] Cada rol ve solo lo que le corresponde
  - [x] Página `/users` con gestión completa
  - [x] Tests RBAC pasando
  - [x] Linting backend sin errores
  - [x] Modal 2FA funcional en Settings

---

### FASE 4: PLAYER SMARTTV (CORE)
**Duración estimada**: 8-10 días  
**Prioridad**: 🔴 CRÍTICA  
**Objetivo**: Reproductor funcional para SmartTVs

#### 4.1 Reproducción Básica (3 días) ✅
- [x] **4.1.1** Setup HLS.js
  - [x] Instalar hls.js en player
  - [x] Componente `<VideoPlayer>` con HLS.js
  - [x] Fallback a video nativo para Safari/iOS
  
- [x] **4.1.2** Playlist secuencial
  - [x] Componente `<PlaylistPlayer>` con loop automático
  - [x] Cargar playlist del display desde API
  - [x] Reproducir videos en secuencia

- [x] **4.1.3** Manejo de imágenes/HTML
  - [x] Componente `<ImageDisplay>` con duración configurable
  - [x] Placeholder para contenido HTML

#### 4.2 Conexión Tiempo Real (2 días) ✅
- [x] **4.2.1** Socket.io client en player
  - [x] Hook `usePlayerSocket` con socket.io-client
  - [x] Registrar display al conectar (`display:register`)
  - [x] Heartbeat cada 30s (`display:heartbeat`)

- [x] **4.2.2** Comandos remotos
  - [x] Recibir `playlist:updated` → recargar playlist
  - [x] Recibir `display:command` (play/pause/restart/refresh-playlist)
  - [x] Pantalla de pairing para displays sin configurar
  - [x] Endpoint `POST /api/displays/confirm-pairing`

#### 4.3 Caché Local con IndexedDB (3 días)
- [x] **4.3.1** Setup Dexie.js ✅ COMPLETADO
  - [x] Instalar Dexie.js (v4.2.1)
  - [x] Schema: contents, segments, metadata
  - [x] Gestión de cuota (navigator.storage.estimate)
  - [x] cacheService con LRU eviction
  - [x] useCache hook
  - [x] PlaylistPlayer integrado con cache

- [x] **4.3.2** Descarga en background ✅ COMPLETADO
  - [x] precachePlaylist() en cacheService.ts
  - [x] CacheIndicator visual en PlaylistPlayer
  - [x] Progress tracking implícito

- [x] **4.3.3** Reproducción desde caché ✅ COMPLETADO
  - [x] useCache hook integrado
  - [x] Prioriza contenido local sobre streaming
  - [x] Limpieza LRU automática al 80%

#### 4.4 Modo Offline (1-2 días) ✅ COMPLETADO
- [x] **4.4.1** Detección de conexión
  - [x] Eventos online/offline
  - [x] Banner visual "Sin conexión"
  - [x] useNetworkStatus hook
  
- [x] **4.4.2** Reproducción offline
  - [x] Continuar con contenido cacheado
  - [x] Cola de eventos para sync posterior
  - [x] useOfflineMode hook
  - [x] Reconexión automática

**Checkpoint Fase 4**: ✅ **COMPLETADO**
- [x] Player reproduce HLS correctamente
- [x] Contenido se cachea localmente (imágenes)
- [x] Funciona offline con contenido cacheado
- [x] Socket.io sincroniza estado

---

### FASE 5: SINCRONIZACIÓN ENTRE PANTALLAS
**Duración estimada**: 5-7 días  
**Prioridad**: 🟡 ALTA  
**Objetivo**: Conductor pattern para sync <200ms

#### 5.1 Backend Sync Server (2 días) ✅ COMPLETADO
- [x] **5.1.1** Timeline autoritativo
  - [x] Tipos sync en shared-types/src/sync.ts
  - [x] syncService.ts con gestión de grupos y estado
  - [x] Broadcast `sync:tick` cada 100ms vía Socket.io
  - [x] Manejo de play/pause/seek/stop

- [x] **5.1.2** Gestión de conductores
  - [x] Asignar rol conductor a primera pantalla conectada
  - [x] Failover automático si conductor se desconecta
  - [x] API REST: POST/GET/PUT/DELETE /api/sync/groups
  - [x] Endpoints: /start, /pause, /resume, /seek, /stop, /conductor

#### 5.2 Player Sync Client (3 días) ✅ COMPLETADO
- [x] **5.2.1** Clock compensation
  - [x] useClockSync.ts con cálculo de offset
  - [x] Promediado de muestras para suavizar variaciones
  - [x] serverNow() retorna tiempo del servidor

- [x] **5.2.2** Ajuste de reproducción
  - [x] useSyncPlayback.ts con soft/hard sync
  - [x] Soft sync: playbackRate ±5% si drift < 500ms
  - [x] Hard sync: seek directo si drift > 2s

- [x] **5.2.3** Late join
  - [x] handleLateJoin() calcula posición correcta
  - [x] Socket events: sync:tick, sync:command, sync:conductor-changed
  - [x] SyncIndicator.tsx muestra estado visual

#### 5.3 Testing de Precisión (1-2 días)
- [ ] Medir precisión real con múltiples pantallas
- [ ] Optimizar parámetros de sync
- [ ] Documentar límites alcanzados

**Checkpoint Fase 5**:
- [ ] Pantallas sincronizadas <200ms
- [ ] Conductor failover funciona
- [ ] Late join sin interrupciones visibles

---

### FASE 6: PROGRAMACIÓN AVANZADA
**Duración estimada**: 4-5 días  
**Prioridad**: 🟡 MEDIA  
**Objetivo**: Scheduling completo con recurrencias

#### 6.1 Backend Scheduling (2 días)
- [ ] **6.1.1** Modelo Schedule en Prisma
  - [ ] Campos: startDate, endDate, recurrence (RRULE)
  - [ ] Relación con Content y Display/DisplayGroup
  
- [ ] **6.1.2** API de programación
  - [ ] CRUD de schedules
  - [ ] Resolver contenido actual por fecha/hora
  - [ ] BullMQ job para activar contenido programado

#### 6.2 Frontend Calendario (2-3 días)
- [ ] **6.2.1** Vista calendario
  - [ ] Calendario semanal/mensual de programación
  - [ ] Drag & drop para asignar contenido
  
- [ ] **6.2.2** Editor de recurrencia
  - [ ] UI para crear reglas (diario, semanal, mensual)
  - [ ] Preview de fechas programadas

**Checkpoint Fase 6**:
- [ ] Contenido se activa automáticamente según schedule
- [ ] Calendario visual funcional
- [ ] Recurrencias calculan correctamente

---

### FASE 7: INFRAESTRUCTURA PRODUCCIÓN
**Duración estimada**: 3-4 días  
**Prioridad**: 🟡 MEDIA  
**Objetivo**: Preparar para deployment real

#### 7.1 MinIO Storage (2 días)
- [ ] **7.1.1** Setup MinIO
  - [ ] Agregar MinIO a docker-compose
  - [ ] Configurar buckets (uploads, hls, thumbnails)
  
- [ ] **7.1.2** Migrar storage service
  - [ ] Reemplazar filesystem por MinIO SDK
  - [ ] URLs públicas para streaming

#### 7.2 Monitoring (1-2 días)
- [ ] **7.2.1** Prometheus + Grafana
  - [ ] Métricas de Socket.io connections
  - [ ] Métricas de BullMQ jobs
  - [ ] Dashboard básico

- [ ] **7.2.2** Alertas
  - [ ] Alerta si display offline > 5 min
  - [ ] Alerta si job queue > 100 pending

**Checkpoint Fase 7**:
- [ ] Videos almacenados en MinIO
- [ ] Dashboard de monitoring operativo
- [ ] Sistema listo para 100+ pantallas

---

### FASE 8: PULIDO Y EXTRAS
**Duración estimada**: Variable  
**Prioridad**: 🟢 BAJA  

- [ ] 2FA modal en frontend
- [ ] Gestión de usuarios en frontend
- [ ] Preview visual de contenido antes de publicar
- [ ] Templates de programación
- [ ] Prioridades de contenido (urgente interrumpe normal)
- [ ] PWA/Service Worker para player
- [ ] Analytics de reproducción
- [ ] Multi-idioma

---

## 📈 MÉTRICAS OBJETIVO

| Métrica | Target | Actual |
|---------|--------|--------|
| Latencia de actualización | <10s | TBD |
| Sincronización pantallas | <200ms | N/A |
| API response time p95 | <100ms | TBD |
| Uptime | 99.9% | N/A |
| Test coverage | 70% | ~30% |

---

## 🎯 ORDEN DE EJECUCIÓN RECOMENDADO

```
FASE 3 (RBAC) ──────────────────┐
                                ├──→ FASE 6 (Scheduling)
FASE 4 (Player) ───→ FASE 5 (Sync) ──→ FASE 7 (Infra) ──→ FASE 8 (Extras)
```

**Justificación**:
1. **Fase 3 primero**: Sin seguridad, el sistema es vulnerable. Bloquea cualquier demo real.
2. **Fase 4 en paralelo o después**: El player es el core del negocio, debe funcionar.
3. **Fase 5 después de 4**: Sync requiere player funcional.
4. **Fase 6-7-8**: Features y polish una vez que el core funciona.

---

**Versión**: 2.0.0  
**Autor**: Janick + Claude
