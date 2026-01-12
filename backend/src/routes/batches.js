import express from 'express';
import multer from 'multer';
import { Batch } from '../models/Batch.js';
import { traceabilityService } from '../services/traceabilityService.js';
import { batchLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { 
  uploadBulkBatchCSV, 
  createBatch,
  getManufacturerStats,
  searchBatches,
  getBatchByManufacturerNumber 
} from '../controllers/batchController.js';

const router = express.Router();

// Configure multer for CSV file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * POST /api/batches/upload-csv
 * Public endpoint (Authentication handled via signed transaction later, or verify owner in body?)
 * For now, we keep it as is, but typically this should be protected too.
 * Let's leave it open or add requireAuth if frontend sends header.
 */
router.post('/upload-csv', batchLimiter, upload.single('csvFile'), uploadBulkBatchCSV);

/**
 * POST /api/batches/manual
 * Create batches from manual JSON input
 * Protected: Requires Wallet Address
 */
router.post('/manual', batchLimiter, requireAuth, createBatch);

/**
 * GET /api/batches/stats
 * Get Manufacturer Dashboard Stats
 * Protected: Requires Wallet Address
 */
router.get('/stats', batchLimiter, requireAuth, getManufacturerStats);

/**
 * GET /api/batches/search
 * Search & Filter Batches
 * Protected: Requires Wallet Address
 */
router.get('/search', batchLimiter, requireAuth, searchBatches);

/**
 * GET /api/batches/by-manufacturer-number/:batchNumber
 * Public: Anyone can track a batch by its public ID
 */
router.get('/by-manufacturer-number/:batchNumber', batchLimiter, getBatchByManufacturerNumber);

/**
 * GET /api/batches/:id
 * Get batch details
 */
router.get('/:id', batchLimiter, async (req, res, next) => {
  try {
    const batchId = parseInt(req.params.id);
    if (isNaN(batchId)) return res.status(400).json({ error: 'Invalid batch ID' });

    const batch = await Batch.findById(batchId).lean();
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const response = { ...batch };
    if (batch.status === 'IN_TRANSIT' && batch.pendingTransfer) {
      response.pendingTransfer = batch.pendingTransfer;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/batches/owner/:address
 * Get all batches owned by an address (Legacy / Public Traceability)
 */
router.get('/owner/:address', batchLimiter, async (req, res, next) => {
  try {
    const result = await traceabilityService.getBatchesByOwner(req.params.address.toLowerCase(), {
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
