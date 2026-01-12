import express from 'express';
import { EventLog } from '../models/EventLog.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * GET /api/events
 * Get event logs with pagination
 */
router.get('/', generalLimiter, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const eventName = req.query.eventName;
    const batchId = req.query.batchId ? parseInt(req.query.batchId) : null;

    const query = {};
    if (eventName) {
      query.eventName = eventName;
    }
    if (batchId) {
      query.batchId = batchId;
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      EventLog.find(query)
        .sort({ blockNumber: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EventLog.countDocuments(query)
    ]);

    res.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/:batchId
 * Get all events for a specific batch
 */
router.get('/:batchId', generalLimiter, async (req, res, next) => {
  try {
    const batchId = parseInt(req.params.batchId);

    if (isNaN(batchId)) {
      return res.status(400).json({ error: 'Invalid batch ID' });
    }

    const events = await EventLog.find({ batchId })
      .sort({ blockNumber: 1 })
      .lean();

    res.json({
      batchId,
      events,
      count: events.length
    });

  } catch (error) {
    next(error);
  }
});


/**
 * POST /api/events/sync
 * Force sync a transaction by hash
 */
router.post('/sync', async (req, res, next) => {
    try {
        const { txHash } = req.body;
        if (!txHash) {
            return res.status(400).json({ error: 'Transaction hash is required' });
        }

        // Dynamic import to avoid circular dependency issues if any
        const { eventProcessor } = await import('../services/eventProcessor.js');
        const result = await eventProcessor.processTransaction(txHash);

        res.json({
            success: true,
            message: `Successfully processed ${result.processedCount} events from block ${result.blockNumber}`,
            details: result
        });
    } catch (error) {
        console.error('Manual Sync Failed:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

export default router;

