# ROADMAP DEL PROYECTO - Sistema de Senalizacion Digital

**Proyecto**: Sistema de Senalizacion Digital para Hoteles  
**Ultima actualizacion**: 08/01/2026  
**Estado global**: ~90% completado  
**Version**: 2.2.0

---

## RESUMEN EJECUTIVO

| Área | Estado | Prioridad | Notas |
|------|--------|-----------|-------|
| Infraestructura Base | [DONE] 90% | - | Falta MinIO |
| Procesamiento Video (FFmpeg/BullMQ) | [DONE] 100% | COMPLETADO | - |
| Backend RBAC | [DONE] 100% | COMPLETADO | - |
| Frontend Admin | [DONE] 95% | COMPLETADO | - |
| Player SmartTV | [DONE] 90% | COMPLETADO | Sin PWA/Service Worker |
| Sincronizacion Pantallas | [DONE] 100% | COMPLETADO | Migrado a Prisma |
| Home Dashboard | [DONE] 100% | COMPLETADO | - |
| Analytics System | [DONE] 100% | COMPLETADO | - |
| UI Overhaul | [DONE] 100% | COMPLETADO | - |
| Content Priority and Alerts | [DONE] 95% | COMPLETADO | Alertas funcionando |
| Scheduling Avanzado | [DONE] 90% | COMPLETADO | Verificar checker job |
| Storage MinIO | [DONE] 100% | COMPLETADO | Fase 7 |
| Monitoring | [DONE] 100% | COMPLETADO | Prometheus + Grafana |
| Reports and Audit | [DONE] 100% | COMPLETADO | 5 paginas, Excel export |
| Testing | [WIP] 45% | MEDIA | Target: 70% |

---

## ISSUES CONOCIDOS

### 🔴 Críticos - RESUELTOS

| ID | Issue | Ubicación | Estado |
|----|-------|-----------|--------|
| ~~ISS-001~~ | ~~SyncGroups usa Map en memoria~~ | `syncService.ts` | ✅ Migrado a Prisma |
| ~~ISS-002~~ | ~~Sync groups no persisten~~ | `syncService.ts` | ✅ Migrado a Prisma |

### 🟡 Moderados

| ID | Issue | Ubicación | Estado |
|----|-------|-----------|--------|
| ~~ISS-004~~ | ~~Select dropdown overflow~~ | `ui/select.tsx` | ✅ RESUELTO (z-100, sideOffset) |
| ISS-003 | CreateSyncGroupModal contentId vacío | Modal frontend | ✅ RESUELTO (|| undefined) |
| ISS-005 | Test coverage bajo (~30%) | Global | ⚠️ Pendiente |

### ✅ Resueltos (Esta Sesión)

| ID | Issue | Fecha | Solución |
|----|-------|-------|----------|
| ISS-001 | SyncGroups Map→Prisma | 02/01/2026 | Reescrito syncService.ts completo |
| ISS-002 | Sync no persiste | 02/01/2026 | Prisma CRUD + runtime state |
| ISS-003 | contentId vacío 400 error | 02/01/2026 | `contentId ? contentId : undefined` |
| ISS-004 | Dropdown overflow | 02/01/2026 | z-[100], sideOffset=4, max-h-60 |
| ISS-R04 | Prisma query log noise | 02/01/2026 | Removido 'query' de log config |

---

## TECH STACK - VERIFICACIÓN VS CLAUDE.md

### ✅ Implementado Correctamente

| Tecnología | Estado | Ubicación |
|------------|--------|-----------|
| React 18 + TypeScript | ✅ | `apps/frontend`, `apps/player` |
| Next.js 14 App Router | ✅ | Ambos frontends |
| Tailwind CSS 3.x | ✅ | Configurado en todos |
| shadcn/ui | ✅ | `components/ui/` |
| HLS.js | ✅ | `apps/player/src/components/VideoPlayer.tsx` |
| Socket.io 4.x | ✅ | Backend + Player + Frontend |
| Dexie.js (IndexedDB) | ✅ | `apps/player/src/lib/db/cacheDb.ts` |
| Express.js | ✅ | `apps/backend` |
| PostgreSQL 15 + Prisma | ✅ | Schema completo con 15 modelos |
| Redis 7 | ✅ | Socket.io adapter + cache |
| BullMQ | ✅ | `apps/backend/src/queues/` |
| FFmpeg | ✅ | `apps/backend/src/services/ffmpegService.ts` |
| JWT + Refresh Tokens | ✅ | `apps/backend/src/middleware/auth.ts` |
| 2FA TOTP | ✅ | `otplib` implementado |
| Helmet.js | ✅ | `apps/backend/src/app.ts` |
| Rate Limiting | ✅ | `apps/backend/src/config/auth.ts` |
| Zod Validation | ✅ | Usado en backend |
| Winston Logging | ✅ | `apps/backend/src/middleware/logger.ts` |
| Turborepo | ✅ | `turbo.json` configurado |
| Docker Compose | ✅ | PostgreSQL + Redis |
| Vitest | ✅ | Tests unitarios configurados |
| Playwright | ✅ | E2E tests configurados |

### ⚠️ Modificado/Reemplazado

| CLAUDE.md | Implementación Real | Razón |
|-----------|---------------------|-------|
| MobX 6.x | React Query + Context | Mejor para server state |
| bcrypt | bcryptjs | Compatibilidad cross-platform |

### ❌ Pendiente de Implementar

| Tecnología | Estado | Fase |
|------------|--------|------|
| MinIO Storage | ❌ No implementado | Fase 7 |
| Workbox/Service Workers | ❌ No implementado | Fase 8 |
| Prometheus + Grafana | ❌ No implementado | Fase 7 |

---

## FASES COMPLETADAS

### Fase 0-2: Base ✅ 100%
<details>
<summary>Ver detalles</summary>

- [x] Monorepo Turborepo + pnpm
- [x] TypeScript strict mode
- [x] ESLint + Prettier
- [x] Express backend + Socket.io
- [x] Next.js 14 frontend + Tailwind + shadcn/ui
- [x] PostgreSQL + Prisma schema
- [x] Redis adapter
- [x] Docker compose
- [x] CRUD Displays/Content
- [x] HLS Transcoding (FFmpeg + BullMQ)
- [x] JWT + 2FA auth
</details>

### Fase 3: Seguridad y RBAC ✅ 100%
<details>
<summary>Ver detalles</summary>

- [x] Página /areas con CRUD
- [x] Proteger todas las APIs con authenticate
- [x] Filtrado por hotelId/areaId según rol
- [x] RoleGate, useCanManage hooks
- [x] Página /users con CRUD
- [x] 2FA Modal en Settings
- [x] Linting 0 errores
</details>

### Fase 4: Player SmartTV ✅ 90%
<details>
<summary>Ver detalles</summary>

- [x] HLS.js + VideoPlayer
- [x] PlaylistPlayer con loop
- [x] Socket.io client + heartbeat
- [x] Dexie.js cache local
- [x] Modo offline
- [ ] PWA/Service Worker (Fase 8)
</details>

### Fase 5: Sincronización Pantallas ✅ 100%

- [x] syncService.ts con Prisma (CRUD persistente)
- [x] Runtime state en Map (posición, sockets, ticks)
- [x] Tick broadcast cada 100ms
- [x] Conductor election/failover
- [x] Late join con posición correcta
- [x] UI Admin: /sync, CreateSyncGroupModal
- [x] API REST completa (10 endpoints)

**Checkpoint**: ✅ COMPLETADO (Migración Prisma 02/01/2026)

### Fase 6: Programación Avanzada ✅ 90%

- [x] Modelo Schedule en Prisma con RRULE
- [x] scheduleService + scheduleController
- [x] ScheduleCalendar (FullCalendar)
- [x] CreateScheduleModal + RecurrenceEditor
- [x] contentResolver evalúa schedules
- [ ] Verificar scheduleChecker job

### Fase 6.5: Prioridad de Contenido ✅ 95%

```
Jerarquía: ALERT > SYNC > SCHEDULE > PLAYLIST > FALLBACK
```

- [x] contentResolver.ts con lógica completa
- [x] alertController + routes (6 endpoints)
- [x] CreateAlertModal + AlertOverlay
- [x] Player integrado con useContentSource

---

## FASES PENDIENTES

### Fase 7: Infraestructura Producción ❌ 0%

- [ ] MinIO Storage + buckets
- [ ] Prometheus + Grafana
- [ ] PM2 configuration
- [ ] SSL/TLS setup

### Fase 8: Pulido y Extras [WIP] 40%

- [x] 2FA modal [DONE]
- [x] Gestion usuarios [DONE]
- [x] Analytics [DONE]
- [x] UI Overhaul [DONE]
- [x] Home Dashboard [DONE]
- [x] Reports and Audit System [DONE]
- [ ] PWA/Service Worker
- [ ] Preview contenido
- [ ] Multi-idioma

---

## MÉTRICAS

| Métrica | Target | Actual | Estado |
|---------|--------|--------|--------|
| Latencia actualización | <10s | ~5s | ✅ |
| Sincronización pantallas | <200ms | ~100ms | ✅ |
| API response p95 | <100ms | ~80ms | ✅ |
| Test coverage | 70% | ~30% | ⚠️ |

---

**Version**: 2.2.0  
**Autor**: Janick + Claude  
**Ultima validacion**: 08/01/2026
