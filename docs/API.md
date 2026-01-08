# API Documentation

Sistema de Senalizacion Digital - REST API Reference

**Base URL**: `http://localhost:3001/api`  
**Version**: 2.2.0

---

## Authentication

All endpoints require authentication via Bearer token unless marked as PUBLIC.

```
Authorization: Bearer <access_token>
```

### Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/login` | Login with email/password | PUBLIC |
| POST | `/auth/register` | Register new user | SUPER_ADMIN |
| POST | `/auth/refresh` | Refresh access token | PUBLIC |
| POST | `/auth/logout` | Logout and invalidate tokens | AUTH |
| GET | `/auth/me` | Get current user | AUTH |
| POST | `/auth/2fa/setup` | Setup 2FA | AUTH |
| POST | `/auth/2fa/verify` | Verify 2FA code | AUTH |
| POST | `/auth/2fa/disable` | Disable 2FA | AUTH |

---

## Displays

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/displays` | List all displays | AUTH |
| POST | `/displays` | Create display | HOTEL_ADMIN+ |
| GET | `/displays/:id` | Get display by ID | AUTH |
| PUT | `/displays/:id` | Update display | HOTEL_ADMIN+ |
| DELETE | `/displays/:id` | Delete display | HOTEL_ADMIN+ |
| GET | `/displays/:id/current-source` | Get current content source | PUBLIC |

---

## Content

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/content` | List content | AUTH |
| POST | `/content` | Upload content | HOTEL_ADMIN+ |
| GET | `/content/:id` | Get content by ID | AUTH |
| PUT | `/content/:id` | Update content | HOTEL_ADMIN+ |
| DELETE | `/content/:id` | Delete content | HOTEL_ADMIN+ |

---

## Schedules

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/schedules` | List schedules | HOTEL_ADMIN+ |
| POST | `/schedules` | Create schedule | HOTEL_ADMIN+ |
| GET | `/schedules/:id` | Get schedule by ID | HOTEL_ADMIN+ |
| PUT | `/schedules/:id` | Update schedule | HOTEL_ADMIN+ |
| DELETE | `/schedules/:id` | Delete schedule | HOTEL_ADMIN+ |
| GET | `/schedules/active/:displayId` | Get active schedule | AUTH |
| GET | `/schedules/:id/preview` | Preview schedule occurrences | HOTEL_ADMIN+ |

---

## Alerts

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/alerts` | List alerts | HOTEL_ADMIN+ |
| POST | `/alerts` | Create alert | HOTEL_ADMIN+ |
| GET | `/alerts/:id` | Get alert by ID | HOTEL_ADMIN+ |
| PUT | `/alerts/:id` | Update alert | HOTEL_ADMIN+ |
| DELETE | `/alerts/:id` | Delete alert | HOTEL_ADMIN+ |
| POST | `/alerts/:id/deactivate` | Deactivate alert | HOTEL_ADMIN+ |

---

## Sync Groups

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/sync/groups` | List sync groups | HOTEL_ADMIN+ |
| POST | `/sync/groups` | Create sync group | HOTEL_ADMIN+ |
| GET | `/sync/groups/:id` | Get sync group | HOTEL_ADMIN+ |
| PUT | `/sync/groups/:id` | Update sync group | HOTEL_ADMIN+ |
| DELETE | `/sync/groups/:id` | Delete sync group | HOTEL_ADMIN+ |
| POST | `/sync/groups/:id/start` | Start playback | HOTEL_ADMIN+ |
| POST | `/sync/groups/:id/pause` | Pause playback | HOTEL_ADMIN+ |
| POST | `/sync/groups/:id/stop` | Stop playback | HOTEL_ADMIN+ |

---

## Reports (NEW)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reports/displays` | Display report data | AREA_MANAGER+ |
| GET | `/reports/displays/export` | Export to Excel | HOTEL_ADMIN+ |
| GET | `/reports/users` | User report data | HOTEL_ADMIN+ |
| GET | `/reports/users/export` | Export to Excel | HOTEL_ADMIN+ |
| GET | `/reports/compliance` | Compliance report | SUPER_ADMIN |
| GET | `/reports/audit` | Audit logs | HOTEL_ADMIN+ |

### Query Parameters

**Display Reports**:
- `from` - Start date (ISO 8601)
- `to` - End date (ISO 8601)
- `hotelId` - Filter by hotel (SUPER_ADMIN only)
- `areaId` - Filter by area

**User Reports**:
- `from` - Start date (ISO 8601)
- `to` - End date (ISO 8601)
- `hotelId` - Filter by hotel (SUPER_ADMIN only)

**Audit Logs**:
- `from` - Start date
- `to` - End date
- `category` - Filter by category
- `severity` - Filter by severity (INFO, WARNING, CRITICAL)
- `limit` - Results per page (default: 100)
- `offset` - Pagination offset

---

## Audit

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/audit/logs` | Get audit logs | HOTEL_ADMIN+ |
| GET | `/audit/summary` | Get audit summary | HOTEL_ADMIN+ |
| GET | `/audit/displays/:id/timeline` | Display timeline | AREA_MANAGER+ |
| GET | `/audit/displays/:id/state-history` | Display state history | AREA_MANAGER+ |
| GET | `/audit/displays/:id/config-history` | Display config history | AREA_MANAGER+ |
| GET | `/audit/users/:id/timeline` | User timeline | HOTEL_ADMIN+ |
| GET | `/audit/sessions` | Active sessions | HOTEL_ADMIN+ |
| POST | `/audit/sessions/:token/revoke` | Revoke session | HOTEL_ADMIN+ |
| GET | `/audit/content/:id/access` | Content access logs | HOTEL_ADMIN+ |

---

## Analytics

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/analytics/overview` | Dashboard overview | HOTEL_ADMIN+ |
| GET | `/analytics/displays` | Display metrics | HOTEL_ADMIN+ |
| GET | `/analytics/bandwidth` | Bandwidth usage | HOTEL_ADMIN+ |
| GET | `/analytics/content` | Content stats | HOTEL_ADMIN+ |

---

## Dashboard

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/dashboard/stats` | System stats | AUTH |

---

## Users

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | List users | HOTEL_ADMIN+ |
| POST | `/users` | Create user | HOTEL_ADMIN+ |
| GET | `/users/:id` | Get user | HOTEL_ADMIN+ |
| PUT | `/users/:id` | Update user | HOTEL_ADMIN+ |
| DELETE | `/users/:id` | Delete user | HOTEL_ADMIN+ |

---

## Hotels

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/hotels` | List hotels | SUPER_ADMIN |
| POST | `/hotels` | Create hotel | SUPER_ADMIN |
| GET | `/hotels/:id` | Get hotel | SUPER_ADMIN |
| PUT | `/hotels/:id` | Update hotel | SUPER_ADMIN |
| DELETE | `/hotels/:id` | Delete hotel | SUPER_ADMIN |

---

## Areas

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/areas` | List areas | HOTEL_ADMIN+ |
| POST | `/areas` | Create area | HOTEL_ADMIN+ |
| GET | `/areas/:id` | Get area | HOTEL_ADMIN+ |
| PUT | `/areas/:id` | Update area | HOTEL_ADMIN+ |
| DELETE | `/areas/:id` | Delete area | HOTEL_ADMIN+ |

---

## Access Levels

| Role | Description |
|------|-------------|
| SUPER_ADMIN | Full system access |
| HOTEL_ADMIN | Hotel-scoped access |
| AREA_MANAGER | Area-scoped access |
| AUTH | Any authenticated user |
| PUBLIC | No authentication required |

---

**Last Updated**: 2026-01-08
