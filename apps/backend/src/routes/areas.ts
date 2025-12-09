/**
 * Area Routes
 * API endpoints for area management
 * All routes are protected with authentication middleware
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAreasHandler,
  getAreaByIdHandler,
  createAreaHandler,
  updateAreaHandler,
  deleteAreaHandler,
} from '../controllers/areaController';

const router: Router = Router();

// =============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// =============================================================================

/**
 * GET /api/areas
 * Get all areas (filtered by user role)
 *
 * RBAC:
 * - SUPER_ADMIN: All areas
 * - HOTEL_ADMIN: Areas in their hotel
 * - AREA_MANAGER: Their specific area
 *
 * Response: 200 OK with array of areas
 */
router.get('/', authenticate, getAreasHandler);

/**
 * GET /api/areas/:id
 * Get a single area by ID
 *
 * RBAC:
 * - SUPER_ADMIN: Any area
 * - HOTEL_ADMIN: Areas in their hotel only
 * - AREA_MANAGER: Their specific area only
 *
 * Response: 200 OK with area details
 * Response: 403 Forbidden if no access
 * Response: 404 Not Found if area doesn't exist
 */
router.get('/:id', authenticate, getAreaByIdHandler);

/**
 * POST /api/areas
 * Create a new area
 *
 * RBAC:
 * - SUPER_ADMIN: Can create for any hotel (hotelId required in body)
 * - HOTEL_ADMIN: Can create for their hotel only (hotelId auto-set)
 * - AREA_MANAGER: Forbidden
 *
 * Body:
 * {
 *   "name": "Lobby Principal",
 *   "description": "Main lobby area",
 *   "hotelId": "hotel-id-123" // Required for SUPER_ADMIN, ignored for HOTEL_ADMIN
 * }
 *
 * Response: 201 Created with new area
 * Response: 403 Forbidden if not allowed
 */
router.post('/', authenticate, createAreaHandler);

/**
 * PATCH /api/areas/:id
 * Update an existing area
 *
 * RBAC:
 * - SUPER_ADMIN: Can update any area
 * - HOTEL_ADMIN: Can update areas in their hotel only
 * - AREA_MANAGER: Forbidden
 *
 * Body:
 * {
 *   "name": "Updated Name",
 *   "description": "Updated description"
 * }
 *
 * Response: 200 OK with updated area
 * Response: 403 Forbidden if no access
 * Response: 404 Not Found if area doesn't exist
 */
router.patch('/:id', authenticate, updateAreaHandler);

/**
 * DELETE /api/areas/:id
 * Delete an area
 *
 * RBAC:
 * - SUPER_ADMIN: Can delete any area
 * - HOTEL_ADMIN: Can delete areas in their hotel only
 * - AREA_MANAGER: Forbidden
 *
 * Note: Deleting an area will set areaId to null for all associated displays and users (onDelete: SetNull)
 *
 * Response: 200 OK with success message
 * Response: 403 Forbidden if no access
 * Response: 404 Not Found if area doesn't exist
 */
router.delete('/:id', authenticate, deleteAreaHandler);

export default router;
