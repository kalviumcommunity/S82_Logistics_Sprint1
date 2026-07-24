import { Router } from 'express';
import { getUsers, patchUserRole } from '../controllers/userController.js';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

// Protected (ADMIN only) endpoints
router.get('/', authenticateToken, authorizeRoles('ADMIN'), getUsers);
router.patch('/:id/role', authenticateToken, authorizeRoles('ADMIN'), patchUserRole);

export default router;
