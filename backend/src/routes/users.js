import express from 'express';
import { registerUser, getUserByWallet } from '../controllers/userController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const registrationLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 5, // Limit each IP to 5 create account requests per `window` (here, per hour)
	message: 'Too many accounts created from this IP, please try again after an hour',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post('/register', registrationLimiter, registerUser);
router.get('/:walletAddress', getUserByWallet);

export default router;
