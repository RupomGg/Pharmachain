/**
 * Middleware to require authentication via Wallet Address
 * Expects 'x-wallet-address' header
 */
export const requireAuth = (req, res, next) => {
  const walletAddress = req.headers['x-wallet-address'];

  if (!walletAddress) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized', 
      message: 'Wallet address header (x-wallet-address) is required' 
    });
  }

  // Attach user to request object
  // In a real app, you might verify a signature here. 
  // For this MVP, we trust the header from the frontend (which gets it from the connected wallet).
  req.user = {
    address: walletAddress.toLowerCase()
  };

  next();
};

export const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.address) {
        console.log('[AUTH] No user address in request');
        return res.status(401).json({ error: 'Unauthorized: No user identifier' });
      }

      console.log(`[AUTH] Checking role ${role} for ${req.user.address}`);
      const { User } = await import('../models/User.js');
      const user = await User.findOne({ walletAddress: req.user.address });
      
      if (!user) {
        console.log('[AUTH] User not found in DB');
        return res.status(404).json({ error: 'User not found' });
      }

      console.log(`[AUTH] Found user: ${user.name}, Role: ${user.role}, Status: ${user.status}`);

      // Check role
      if (Array.isArray(role)) {
          if (!role.includes(user.role)) {
               console.log(`[AUTH] Role mismatch. Required one of: ${role.join(',')}, Got: ${user.role}`);
               return res.status(403).json({ error: `Forbidden: Requires one of roles ${role.join(', ')}` });
          }
      } else {
          if (user.role !== role) {
            console.log(`[AUTH] Role mismatch. Required: ${role}, Got: ${user.role}`);
            return res.status(403).json({ error: `Forbidden: Requires ${role} role` });
          }
      }
      
      req.user.details = user; 
      next();

    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Internal server error during role check' });
    }
  };
};
