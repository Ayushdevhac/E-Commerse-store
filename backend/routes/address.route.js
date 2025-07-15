import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/address.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Get all addresses for the current user
router.get('/', getUserAddresses);

// Add a new address
router.post('/', addAddress);

// Update an existing address
router.put('/:addressId', updateAddress);

// Delete an address
router.delete('/:addressId', deleteAddress);

// Set default address
router.patch('/:addressId/default', setDefaultAddress);

export default router;
