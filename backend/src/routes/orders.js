import express from 'express';
import { getMarketplace, createOrder, getManufacturerOrders, getDistributorOrders, confirmOrder } from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';

const router = express.Router();

// Public/Protected Routes
router.get('/marketplace', requireAuth, getMarketplace);
router.post('/', requireAuth, createOrder);

// Role specific
router.get('/received', requireAuth, requireRole('MANUFACTURER'), getManufacturerOrders); // Updated path
router.get('/sent', requireAuth, getDistributorOrders); // Updated path

router.patch('/:id/confirm', requireAuth, requireRole('MANUFACTURER'), confirmOrder); // Updated Method & Handler

export default router;
