import { Order } from '../models/Order.js';
import { Batch } from '../models/Batch.js';
import { ethers } from 'ethers';
import { eventProcessor } from '../services/eventProcessor.js';

// Helper to validate address
const isValidAddress = (addr) => ethers.isAddress(addr);

export const getMarketplace = async (req, res) => {
  try {
    const { search } = req.query;
    // Fix: Query 'quantity' (available stock) not 'quantityRequested'
    // Also filter for CREATED status (available for sale)
    let query = { 
        quantity: { $gt: 0 },
        status: 'CREATED',
        owner: { $ne: req.user.address } // Fix: Don't show own batches
    };

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    
    // In a real app we might filter by owner role
    const batches = await Batch.find(query).sort({ createdAt: -1 }).limit(50);
    
    // Flatten financials for frontend compatibility
    const formattedBatches = batches.map(batch => {
        const doc = batch.toObject();
        return {
            ...doc,
            baseUnitPrice: doc.financials?.baseUnitPrice,
            baseUnitCost: doc.financials?.baseUnitCost
        };
    });

    res.json(formattedBatches);
  } catch (error) {
    console.error('Get Marketplace Error:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace items' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { manufacturer, batchId, quantityRequested, totalPrice, productName } = req.body;
    // Assuming req.user is populated by auth middleware
    const distributor = req.user?.address; 

    if (!distributor) {
        return res.status(401).json({ error: 'User address not found in request' });
    }

    // Validate required fields (checking undefined to allow 0 for batchId or free items)
    const missingFields = [];
    if (!manufacturer) missingFields.push('manufacturer');
    if (batchId === undefined || batchId === null) missingFields.push('batchId');
    if (!quantityRequested) missingFields.push('quantityRequested');
    if (totalPrice === undefined || totalPrice === null) missingFields.push('totalPrice');

    if (missingFields.length > 0) {
      console.warn(`[Create Order] Missing fields: ${missingFields.join(', ')}`, req.body);
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    if (quantityRequested <= 0) {
        return res.status(400).json({ error: 'Quantity requested must be a positive number' });
    }

    const order = new Order({
      distributor,
      manufacturer,
      batchId,
      quantityRequested,
      totalPrice,
      productName: productName || `Batch #${batchId}`,
      status: 'PENDING'
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getManufacturerOrders = async (req, res) => {
  try {
    const manufacturer = req.user?.address;
    if (!manufacturer) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await Order.find({ 
      manufacturer: { $regex: new RegExp(`^${manufacturer}$`, 'i') }, 
      status: 'PENDING' 
    }).sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error('Get Manufacturer Orders Error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getDistributorOrders = async (req, res) => {
    try {
      const distributor = req.user?.address;
      if (!distributor) return res.status(401).json({ error: 'Unauthorized' });

      const orders = await Order.find({ 
        distributor: { $regex: new RegExp(`^${distributor}$`, 'i') }
      }).sort({ createdAt: -1 });
      
      res.json(orders);
    } catch (error) {
      console.error('Get Distributor Orders Error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  };

export const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { txHash } = req.body;

    if (!txHash) {
      return res.status(400).json({ error: 'Transaction hash is required' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // specific check: ensure caller is the manufacturer
    const caller = req.user?.address;
    if (!caller || caller.toLowerCase() !== order.manufacturer.toLowerCase()) {
       return res.status(403).json({ error: 'Unauthorized: Only the manufacturer can confirm this order' });
    }

    console.log(`[Order] Confirming Order #${id} with TX: ${txHash}`);

    // 1. Force Process Transaction (Syncs Event Logs, Updates Batches)
    // This creates the distributor batch and updates manufacturer stock
    try {
        const procesResult = await eventProcessor.processTransaction(txHash);
        console.log(`[Order] Transaction processed successfully. Events: ${procesResult.processedCount}`);
    } catch (err) {
        console.error(`[Order] Failed to verify transaction execution: ${err.message}`);
        return res.status(400).json({ error: `Blockchain verification failed: ${err.message}` });
    }

    // 2. Mark Order as Completed
    order.status = 'COMPLETED'; 
    order.txHash = txHash;
    order.updatedAt = Date.now();
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Confirm Order Error:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
};
