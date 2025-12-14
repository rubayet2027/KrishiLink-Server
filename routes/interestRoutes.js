import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  submitInterest,
  acceptInterest,
  rejectInterest,
  getMyInterests,
  cancelInterest,
  getCropInterests
} from '../controllers/interestController.js';

const router = express.Router();

/**
 * Interest Routes
 * 
 * Base path: /api/interests
 */

// Get current user's submitted interests
router.get('/my-interests', verifyToken, getMyInterests);

// Submit interest on a crop
router.post('/:cropId', verifyToken, submitInterest);

// Get all interests for a crop (owner only)
router.get('/:cropId', verifyToken, getCropInterests);

// Accept an interest (owner only)
router.patch('/:cropId/:interestId/accept', verifyToken, acceptInterest);

// Reject an interest (owner only)
router.patch('/:cropId/:interestId/reject', verifyToken, rejectInterest);

// Cancel/withdraw a pending interest (buyer only)
router.delete('/:cropId/:interestId', verifyToken, cancelInterest);

export default router;
