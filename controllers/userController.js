import { getCollection } from '../config/database.js';
import { validateUserData } from '../models/User.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const { user } = req;
  
  const usersCollection = getCollection('users');
  
  const userProfile = await usersCollection.findOne(
    { uid: user.uid },
    { projection: { _id: 0 } } 
  );
  
  if (!userProfile) {
    throw new ApiError(404, 'User profile not found', 'USER_NOT_FOUND');
  }
  
  res.json({
    success: true,
    data: userProfile
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { user } = req;
  const updateData = req.body;
  
  // Validate update data
  const validation = validateUserData(updateData);
  if (!validation.isValid) {
    throw new ApiError(400, validation.errors.join(', '), 'VALIDATION_ERROR');
  }
  
  const usersCollection = getCollection('users');
  
  // Build update object (only allow certain fields to be updated)
  const allowedUpdates = [
    'name', 'phone', 'address', 'role', 'farmDetails', 'photoURL'
  ];
  
  const updateFields = {};
  
  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      if (field === 'address' && typeof updateData[field] === 'object') {
        // Merge address fields
        updateFields.address = updateData[field];
      } else if (field === 'farmDetails' && typeof updateData[field] === 'object') {
        // Merge farm details
        updateFields.farmDetails = updateData[field];
      } else if (typeof updateData[field] === 'string') {
        updateFields[field] = updateData[field].trim();
      } else {
        updateFields[field] = updateData[field];
      }
    }
  }
  
  updateFields.updatedAt = new Date();
  
  const result = await usersCollection.findOneAndUpdate(
    { uid: user.uid },
    { $set: updateFields },
    { returnDocument: 'after', projection: { _id: 0 } }
  );
  
  if (!result) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: result
  });
});


export const getPublicProfile = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  
  const usersCollection = getCollection('users');
  
  const userProfile = await usersCollection.findOne(
    { uid },
    {
      projection: {
        _id: 0,
        uid: 1,
        name: 1,
        photoURL: 1,
        address: {
          division: 1,
          district: 1
        },
        role: 1,
        farmDetails: {
          farmName: 1,
          farmType: 1,
          mainCrops: 1
        },
        isVerified: 1,
        rating: 1,
        stats: 1,
        createdAt: 1
      }
    }
  );
  
  if (!userProfile) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }
  
  res.json({
    success: true,
    data: userProfile
  });
});


export const getUserStats = asyncHandler(async (req, res) => {
  const { user } = req;
  
  const usersCollection = getCollection('users');
  const cropsCollection = getCollection('crops');
  
  // Get user document
  const userDoc = await usersCollection.findOne({ uid: user.uid });
  
  if (!userDoc) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }
  
  // Get detailed stats from crops collection
  const [cropStats, interestStats] = await Promise.all([
    // Crop stats (as seller)
    cropsCollection.aggregate([
      { $match: { 'owner.uid': user.uid } },
      {
        $group: {
          _id: null,
          totalCrops: { $sum: 1 },
          availableCrops: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          },
          soldOutCrops: {
            $sum: { $cond: [{ $eq: ['$status', 'sold_out'] }, 1, 0] }
          },
          totalInterestsReceived: { $sum: { $size: { $ifNull: ['$interests', []] } } },
          pendingInterests: {
            $sum: {
              $size: {
                $filter: {
                  input: { $ifNull: ['$interests', []] },
                  cond: { $eq: ['$$this.status', 'pending'] }
                }
              }
            }
          }
        }
      }
    ]).toArray(),
    
    // Interest stats (as buyer)
    cropsCollection.aggregate([
      { $unwind: '$interests' },
      { $match: { 'interests.buyerUid': user.uid } },
      {
        $group: {
          _id: null,
          totalInterestsSubmitted: { $sum: 1 },
          pendingInterests: {
            $sum: { $cond: [{ $eq: ['$interests.status', 'pending'] }, 1, 0] }
          },
          acceptedInterests: {
            $sum: { $cond: [{ $eq: ['$interests.status', 'accepted'] }, 1, 0] }
          },
          rejectedInterests: {
            $sum: { $cond: [{ $eq: ['$interests.status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]).toArray()
  ]);
  
  res.json({
    success: true,
    data: {
      user: {
        rating: userDoc.rating,
        memberSince: userDoc.createdAt
      },
      asSeller: cropStats[0] || {
        totalCrops: 0,
        availableCrops: 0,
        soldOutCrops: 0,
        totalInterestsReceived: 0,
        pendingInterests: 0
      },
      asBuyer: interestStats[0] || {
        totalInterestsSubmitted: 0,
        pendingInterests: 0,
        acceptedInterests: 0,
        rejectedInterests: 0
      }
    }
  });
});


export const deleteAccount = asyncHandler(async (req, res) => {
  const { user } = req;
  
  const usersCollection = getCollection('users');
  const cropsCollection = getCollection('crops');
  
  // Delete all user's crops
  await cropsCollection.deleteMany({ 'owner.uid': user.uid });
  
  // Remove user's interests from all crops
  await cropsCollection.updateMany(
    { 'interests.buyerUid': user.uid },
    { $pull: { interests: { buyerUid: user.uid } } }
  );
  
  // Delete user document
  await usersCollection.deleteOne({ uid: user.uid });
  
  res.json({
    success: true,
    message: 'Account and all associated data deleted successfully'
  });
});
