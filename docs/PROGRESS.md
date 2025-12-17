# 📊 ROADMAP DEL PROYECTO - Sistema de Señalización Digital

**Proyecto**: Sistema de Señalización Digital para Hoteles  
**Última actualización**: 17/12/2025  
**Estado global**: ~45% completado

---

## 📋 RESUMEN EJECUTIVO

| Área | Estado | Prioridad |
|------|--------|-----------|
| Infraestructura Base | ✅ 95% | - |
| Procesamiento Video (FFmpeg/BullMQ) | ✅ 100% | - |
| Backend RBAC | ⚠️ 40% | 🔴 CRÍTICA |
| Frontend Admin | ⚠️ 60% | 🟡 ALTA |
| Player SmartTV | ❌ 5% | 🔴 CRÍTICA |
| Sincronización Pantallas | ❌ 0% | 🟡 ALTA |
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

#### 3.1 Backend - Proteger APIs (2-3 días)
- [ ] **3.1.1** Proteger rutas de Displays
  - [ ] Agregar `authenticate` middleware a todas las rutas
  - [ ] Filtrar displays por `hotelId` del usuario
  - [ ] `AREA_MANAGER`: solo displays de su área
  - [ ] `HOTEL_ADMIN`: todos los displays de su hotel
  - [ ] `SUPER_ADMIN`: acceso total
  
- [ ] **3.1.2** Proteger rutas de Content
  - [ ] Agregar `authenticate` middleware
  - [ ] Filtrar contenido por `hotelId`
  - [ ] Mismo patrón RBAC que displays

- [ ] **3.1.3** Proteger rutas de DisplayContent (Playlists)
  - [ ] Validar permisos sobre display destino
  - [ ] Validar permisos sobre contenido asignado

#### 3.2 Frontend - Diferenciación por Rol (2-3 días)
- [ ] **3.2.1** Sidebar condicional
  - [ ] Ocultar "Gestión de Hoteles" para non-SUPER_ADMIN
  - [ ] Ocultar "Gestión de Usuarios" para AREA_MANAGER
  - [ ] Mostrar solo secciones permitidas por rol

- [ ] **3.2.2** Filtrado en vistas
  - [ ] `/displays` - mostrar solo displays permitidos
  - [ ] `/content` - mostrar solo contenido del hotel
  - [ ] `/areas` - filtrar según permisos

- [ ] **3.2.3** Protección de rutas frontend
  - [ ] Redirect si accede a ruta no permitida
  - [ ] Componente `<RoleGate>` para renderizado condicional

#### 3.3 Testing RBAC (1 día)
- [ ] Tests de integración por cada rol
- [ ] Verificar que AREA_MANAGER no puede acceder a otro hotel
- [ ] Verificar bypass de SUPER_ADMIN

#### 3.4 Frontend - Gestión de Usuarios (2 días)
- [ ] **3.4.1** Página `/users`
  - [ ] Tabla de usuarios con rol, hotel, área
  - [ ] Solo visible para HOTEL_ADMIN+ 

- [ ] **3.4.2** CRUD Usuarios
  - [ ] Crear usuario con rol asignado
  - [ ] Editar rol/hotel/área de usuario
  - [ ] Desactivar/eliminar usuario

- [ ] **3.4.3** 2FA Modal
  - [ ] Modal para activar/desactivar 2FA
  - [ ] Mostrar QR code para escanear
  - [ ] Input para código de verificación

**Checkpoint Fase 3**:
- [ ] Página `/areas` funcional con CRUD
- [ ] Ninguna API accesible sin token válido
- [ ] Cada rol ve solo lo que le corresponde
- [ ] Página `/users` con gestión completa
- [ ] Tests RBAC pasando

---

### FASE 4: PLAYER SMARTTV (CORE)
**Duración estimada**: 8-10 días  
**Prioridad**: 🔴 CRÍTICA  
**Objetivo**: Reproductor funcional para SmartTVs

#### 4.1 Reproducción Básica (3 días)
- [ ] **4.1.1** Setup HLS.js
  - [ ] Instalar y configurar HLS.js
  - [ ] Componente `<VideoPlayer>` con controles
  - [ ] Fallback a video nativo si soporta HLS
  
- [ ] **4.1.2** Playlist secuencial
  - [ ] Cargar playlist del display desde API
  - [ ] Reproducir videos en secuencia
  - [ ] Loop automático al terminar

- [ ] **4.1.3** Manejo de imágenes/HTML
  - [ ] Mostrar imágenes con duración configurable
  - [ ] Renderizar contenido HTML animado

#### 4.2 Conexión Tiempo Real (2 días)
- [ ] **4.2.1** Socket.io client en player
  - [ ] Conectar al backend con deviceId
  - [ ] Registrar display al conectar
  - [ ] Heartbeat cada 30s para lastSeen

- [ ] **4.2.2** Comandos remotos
  - [ ] Recibir `content-update` → recargar playlist
  - [ ] Recibir `display-command` (play/pause/restart)
  - [ ] Actualizar status en tiempo real

#### 4.3 Caché Local con IndexedDB (3 días)
- [ ] **4.3.1** Setup Dexie.js
  - [ ] Instalar Dexie.js
  - [ ] Schema: videos, chunks, metadata
  - [ ] Gestión de cuota (navigator.storage.estimate)

- [ ] **4.3.2** Descarga en background
  - [ ] Descargar contenido programado anticipadamente
  - [ ] Chunking de videos grandes (10-20MB chunks)
  - [ ] Progress tracking

- [ ] **4.3.3** Reproducción desde caché
  - [ ] Priorizar contenido local sobre streaming
  - [ ] Fallback a streaming si no está en caché
  - [ ] Limpieza LRU cuando cuota > 80%

#### 4.4 Modo Offline (1-2 días)
- [ ] **4.4.1** Detección de conexión
  - [ ] Eventos online/offline
  - [ ] Banner visual "Sin conexión"
  
- [ ] **4.4.2** Reproducción offline
  - [ ] Continuar con contenido cacheado
  - [ ] Cola de eventos para sync posterior

**Checkpoint Fase 4**:
- [ ] Player reproduce HLS correctamente
- [ ] Contenido se cachea localmente
- [ ] Funciona offline con contenido previamente cacheado
- [ ] Socket.io sincroniza estado

---

### FASE 5: SINCRONIZACIÓN ENTRE PANTALLAS
**Duración estimada**: 5-7 días  
**Prioridad**: 🟡 ALTA  
**Objetivo**: Conductor pattern para sync <200ms

#### 5.1 Backend Sync Server (2 días)
- [ ] **5.1.1** Timeline autoritativo
  - [ ] Endpoint `POST /api/sync/start` con contentId y startTime
  - [ ] Broadcast `sync-tick` cada 100ms vía Socket.io
  - [ ] Manejo de pause/resume global

- [ ] **5.1.2** Gestión de conductores
  - [ ] Asignar rol conductor a primera pantalla
  - [ ] Failover si conductor se desconecta
  - [ ] Workers siguen timeline del conductor

#### 5.2 Player Sync Client (3 días)
- [ ] **5.2.1** Clock compensation
  - [ ] Calcular offset servidor-cliente
  - [ ] Drift correction con regresión lineal

- [ ] **5.2.2** Ajuste de reproducción
  - [ ] Soft sync: ajustar playbackRate (±5%)
  - [ ] Hard sync: seek directo si drift > 1s

- [ ] **5.2.3** Late join
  - [ ] Calcular posición correcta al conectar
  - [ ] Buffering antes de iniciar reproducción

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
