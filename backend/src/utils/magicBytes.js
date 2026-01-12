/**
 * Magic Bytes Validation Utility
 * 
 * Validates file signatures to prevent:
 * - Renamed executables (.exe renamed to .pdf)
 * - Malware uploads
 * - File type spoofing
 */

/**
 * File signature database (magic bytes)
 */
const MAGIC_BYTES = {
  pdf: [0x25, 0x50, 0x44, 0x46],                    // %PDF
  jpg: [0xFF, 0xD8, 0xFF],                          // JPEG
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
  zip: [0x50, 0x4B, 0x03, 0x04],                    // ZIP
  txt: null,                                         // Text files have no magic bytes
  exe: [0x4D, 0x5A],                                // EXE (Windows executable)
  elf: [0x7F, 0x45, 0x4C, 0x46],                    // ELF (Linux executable)
  mach: [0xFE, 0xED, 0xFA, 0xCE]                    // Mach-O (macOS executable)
};

/**
 * Validate file magic bytes
 * 
 * @param {Buffer} buffer - File buffer
 * @param {string} expectedType - Expected file type (pdf, jpg, png, etc.)
 * @returns {Promise<boolean>} True if valid
 */
export async function validateMagicBytes(buffer, expectedType) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Empty file buffer');
  }

  const signature = MAGIC_BYTES[expectedType.toLowerCase()];

  // Text files have no magic bytes, skip validation
  if (signature === null) {
    return true;
  }

  if (!signature) {
    throw new Error(`Unknown file type: ${expectedType}`);
  }

  // ============ Check for Executable Files (Security) ============
  const executableSignatures = [
    MAGIC_BYTES.exe,
    MAGIC_BYTES.elf,
    MAGIC_BYTES.mach
  ];

  for (const execSig of executableSignatures) {
    if (matchesSignature(buffer, execSig)) {
      throw new Error('Executable files are not allowed. This file appears to be a Windows/Linux/macOS executable.');
    }
  }

  // ============ Validate Expected Signature ============
  const isValid = matchesSignature(buffer, signature);

  return isValid;
}

/**
 * Check if buffer matches signature
 * 
 * @param {Buffer} buffer - File buffer
 * @param {Array<number>} signature - Expected byte signature
 * @returns {boolean} True if matches
 */
function matchesSignature(buffer, signature) {
  if (buffer.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Get file type from buffer (auto-detect)
 * 
 * @param {Buffer} buffer - File buffer
 * @returns {string|null} Detected file type or null
 */
export function detectFileType(buffer) {
  for (const [type, signature] of Object.entries(MAGIC_BYTES)) {
    if (signature && matchesSignature(buffer, signature)) {
      return type;
    }
  }

  return null;
}

/**
 * Validate file extension matches content
 * 
 * @param {string} filename - Original filename
 * @param {Buffer} buffer - File buffer
 * @returns {boolean} True if extension matches content
 */
export function validateFileExtension(filename, buffer) {
  const ext = filename.split('.').pop().toLowerCase();
  const detectedType = detectFileType(buffer);

  if (!detectedType) {
    // Cannot detect type, assume valid for text files
    return true;
  }

  return ext === detectedType;
}
