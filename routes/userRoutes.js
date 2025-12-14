import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  getPublicProfile,
  getUserStats,
  deleteAccount
} from '../controllers/userController.js';

const router = express.Router();

/**
 * User Routes
 * 
 * Base path: /api/users
 */

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/stats', verifyToken, getUserStats);
router.delete('/profile', verifyToken, deleteAccount);

// Public routes
router.get('/:uid', getPublicProfile);

export default router;
