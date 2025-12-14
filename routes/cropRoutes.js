import express from 'express';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
import {
  getAllCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
  getMyPosts,
  getCategories
} from '../controllers/cropController.js';

const router = express.Router();

/**
 * Crop Routes
 * 
 * Base path: /api/crops
 */

// Public routes
router.get('/', getAllCrops);
router.get('/categories', getCategories);

// Protected routes (must be before /:id to avoid conflict)
router.get('/my-posts', verifyToken, getMyPosts);
router.post('/', verifyToken, createCrop);

// Routes with optional auth (for ownership check)
router.get('/:id', optionalAuth, getCropById);

// Protected routes with ownership verification
router.put('/:id', verifyToken, updateCrop);
router.delete('/:id', verifyToken, deleteCrop);

export default router;
