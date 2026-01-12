import { User } from '../models/User.js';
import { ethers } from 'ethers';
import { generateIdentityHash } from '../utils/hashUtils.js';

// Rate limiter is applied in routes, not here directly, but the logic handles the requests

export const registerUser = async (req, res) => {
  try {
    const { walletAddress, name, email, phone, physicalAddress, licenseNumber, requestedRole } = req.body;
    console.log('[API] Register request received:', { walletAddress, name, email, requestedRole });

    // Validate required fields
    if (!walletAddress || !name || !email || !requestedRole) {
      return res.status(400).json({ error: 'Missing required fields: walletAddress, name, email, requestedRole' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate role
    const validRoles = ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'PATIENT'];
    if (!validRoles.includes(requestedRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be one of: MANUFACTURER, DISTRIBUTOR, PHARMACY, PATIENT' });
    }

    // Check for existing user by wallet address
    const existingUserByWallet = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (existingUserByWallet) {
      if (existingUserByWallet.status === 'PENDING') {
         return res.status(400).json({ error: 'Registration request already pending.', user: existingUserByWallet });
      }
      if (existingUserByWallet.status === 'APPROVED') {
         return res.status(400).json({ error: 'This wallet is already registered. Please login.', user: existingUserByWallet });
      }
      
      // If REJECTED, allow re-application
      if (existingUserByWallet.status === 'REJECTED') {
           existingUserByWallet.requestedRole = requestedRole;
           existingUserByWallet.status = 'PENDING';
           existingUserByWallet.name = name;
           existingUserByWallet.email = email;
           existingUserByWallet.phone = phone;
           existingUserByWallet.physicalAddress = physicalAddress;
           existingUserByWallet.licenseNumber = licenseNumber;
           
           // Regenerate identity hash
           existingUserByWallet.identityHash = generateIdentityHash({
             name,
             email,
             phone: phone || '',
             physicalAddress: physicalAddress || '',
             licenseNumber: licenseNumber || ''
           });
           
           await existingUserByWallet.save();
           return res.status(200).json({ message: 'Re-application submitted successfully', user: existingUserByWallet });
      }
    }

    // Check for existing user by email
    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'This email is already registered.' });
    }

    // Generate identity hash server-side
    const identityHash = generateIdentityHash({
      name,
      email,
      phone: phone || '',
      physicalAddress: physicalAddress || '',
      licenseNumber: licenseNumber || ''
    });

    // Create new user
    const newUser = new User({
      walletAddress: walletAddress.toLowerCase(),
      name,
      email: email.toLowerCase(),
      phone,
      physicalAddress,
      licenseNumber,
      requestedRole,
      status: 'PENDING',
      identityHash,
      isRegisteredOnChain: false
    });

    await newUser.save();

    res.status(201).json({ 
      message: 'Registration submitted successfully. Please wait for admin approval.', 
      user: {
        walletAddress: newUser.walletAddress,
        name: newUser.name,
        email: newUser.email,
        requestedRole: newUser.requestedRole,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const getPendingUsers = async (req, res) => {
  try {
    console.log('[API] Fetching Pending Users...');
    const users = await User.find({ status: 'PENDING' }).sort({ createdAt: -1 });
    console.log(`[API] Found ${users.length} pending users.`);
    res.json(users);
  } catch (error) {
    console.error('[API] Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { walletAddress, status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await User.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      { status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED' }, // If approved, update status to approved. For now role update happens on chain, but we can sync here too.
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (status === 'APPROVED' && user.requestedRole) {
        user.role = user.requestedRole; // Sync role
        await user.save();
    }

    res.json({ message: `User ${status}`, user });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

export const getUserByWallet = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

export const getUserStats = async (req, res) => {
    try {
        console.log('[API] Fetching User Stats from DB...');
        
        // Count users by role (only counting APPROVED users effectively represents active participants, 
        // but the prompt implies showing all stats. Let's count APPROVED for accurate ecosystem stats
        // or just count by role field if that's how they are stored).
        // Based on registration, 'role' defaults to GUEST until approved? 
        // Let's check updateStatus: "user.role = user.requestedRole". So 'role' is the source of truth for approved users.

        // We want to count actual participants (likely APPROVED ones with a valid role)
        const manufacturers = await User.countDocuments({ role: 'MANUFACTURER' });
        const distributors = await User.countDocuments({ role: 'DISTRIBUTOR' });
        const pharmacies = await User.countDocuments({ role: 'PHARMACY' });
        
        // Total could be sum of above, or total non-guest users
        const total = manufacturers + distributors + pharmacies;

        console.log('[API] Stats:', { total, manufacturers, distributors, pharmacies });

        res.json({
            total,
            manufacturers,
            distributors,
            pharmacies
        });
    } catch (error) {
        console.error('[API] Error fetching user stats:', error);
        res.status(500).json({ error: 'Failed to fetch user stats' });
    }
};
