import express from 'express';
import { traceabilityService } from '../services/traceabilityService.js';
import { traceLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/trace/search
 * Search by Batch Number or Product Name
 * Query: ?q=...
 */
router.get('/search', traceLimiter, async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await traceabilityService.searchBatches(q);

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No matching batches found' });
    }

    // If exactly one result (likely batch number match), return full trace
    if (results.length === 1) {
       // We can either return the simple batch OR the full trace.
       // The prompt said: "retrieve its full journey". 
       // So if unique match, let's give the full trace!
       const fullTrace = await traceabilityService.getFullTrace(results[0]._id);
       return res.json(fullTrace);
    }

    // Otherwise return list of candidates
    return res.json({
      count: results.length,
      candidates: results.map(b => ({
        batchId: b._id,
        batchNumber: b.batchNumber, // Display ID
        productName: b.productName,
        manufacturer: b.manufacturer,
        expiryDate: b.expiryDate,
        status: b.status
      }))
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/trace/:batchId
 * Get full lineage (upstream + downstream)
 */
router.get('/:batchId', traceLimiter, async (req, res, next) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }

    const trace = await traceabilityService.getFullTrace(batchId);

    res.json(trace);

  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * GET /api/trace/:batchId/upstream
 * Get upstream lineage only
 */
router.get('/:batchId/upstream', traceLimiter, async (req, res, next) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
       return res.status(400).json({ error: 'Batch ID is required' });
    }

    const result = await traceabilityService.getUpstreamLineage(batchId);

    res.json({
      batch: result.batch,
      upstream: result.ancestors || []
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/trace/:batchId/downstream
 * Get downstream distribution only
 */
router.get('/:batchId/downstream', traceLimiter, async (req, res, next) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
       return res.status(400).json({ error: 'Batch ID is required' });
    }

    const result = await traceabilityService.getDownstreamDistribution(batchId);

    res.json({
      batch: result.batch,
      downstream: result.descendants || []
    });

  } catch (error) {
    next(error);
  }
});

export default router;
