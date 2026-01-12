import express from 'express';
import { getPendingUsers, updateUserStatus, getUserStats } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';

const router = express.Router();

// Use standard auth middleware (Expects x-wallet-address, NOT x-admin-wallet)
// Note: Frontend must send 'x-wallet-address' header now.
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/pending-users', getPendingUsers);
router.put('/update-status', updateUserStatus);
router.get('/stats', getUserStats);

export default router;
