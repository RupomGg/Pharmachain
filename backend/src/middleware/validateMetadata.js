import multer from 'multer';
import { validateMagicBytes } from '../utils/magicBytes.js';

/**
 * Metadata Validation Middleware
 * 
 * Security checks:
 * 1. File size limit (5MB)
 * 2. Magic bytes validation (prevent .exe renamed as .pdf)
 * 3. File type whitelist
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Whitelist of allowed MIME types
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/zip',
      'text/plain'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

/**
 * Validate metadata file middleware
 */
export const validateMetadata = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: 'No file provided'
        });
      }

      // Get expected document type from request
      const docType = req.body.docType || req.query.docType;

      if (!docType) {
        return res.status(400).json({
          error: 'Document type (docType) is required'
        });
      }

      // Map MIME type to file extension
      const mimeToExt = {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'application/zip': 'zip',
        'text/plain': 'txt'
      };

      const expectedType = mimeToExt[file.mimetype];

      if (!expectedType) {
        return res.status(400).json({
          error: 'Unsupported file type'
        });
      }

      // ============ Magic Bytes Validation ============
      const isValid = await validateMagicBytes(file.buffer, expectedType);

      if (!isValid) {
        return res.status(400).json({
          error: 'File type mismatch. File signature does not match declared type.',
          details: 'This could be a renamed executable or malicious file'
        });
      }

      // File is valid, continue
      next();

    } catch (error) {
      if (error.message.includes('Executable files')) {
        return res.status(400).json({
          error: 'Executable files are not allowed',
          details: error.message
        });
      }

      res.status(400).json({
        error: 'File validation failed',
        details: error.message
      });
    }
  }
];

/**
 * Handle multer errors
 */
export function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      details: err.message
    });
  }

  next(err);
}
