import express from 'express';
import { validateMetadata, handleMulterError } from '../middleware/validateMetadata.js';
import { metadataLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/metadata/validate
 * Validate metadata file before IPFS upload
 */
router.post('/validate', metadataLimiter, validateMetadata, async (req, res, next) => {
  try {
    const file = req.file;

    // File passed validation
    res.json({
      valid: true,
      file: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        sizeFormatted: `${(file.size / 1024).toFixed(2)} KB`
      },
      message: 'File validation passed. Safe to upload to IPFS.'
    });

  } catch (error) {
    next(error);
  }
});

// Apply multer error handler
router.use(handleMulterError);

export default router;
