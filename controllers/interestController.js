import { ObjectId } from 'mongodb';
import { getCollection } from '../config/database.js';
import { validateInterestData, interestStatus } from '../models/Crop.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';


export const submitInterest = asyncHandler(async (req, res) => {
  const { cropId } = req.params;
  const { user } = req;
  const { requestedQuantity, message } = req.body;
  
  if (!ObjectId.isValid(cropId)) {
    throw new ApiError(400, 'Invalid crop ID', 'INVALID_ID');
  }
  
  const cropsCollection = getCollection('crops');
  
  const crop = await cropsCollection.findOne({ _id: new ObjectId(cropId) });
  
  if (!crop) {
    throw new ApiError(404, 'Crop not found', 'CROP_NOT_FOUND');
  }
  
  if (crop.status !== 'available') {
    throw new ApiError(400, 'This crop is no longer available', 'CROP_NOT_AVAILABLE');
  }
  
  if (crop.owner.uid === user.uid) {
    throw new ApiError(400, 'You cannot submit interest on your own crop', 'SELF_INTEREST_NOT_ALLOWED');
  }
  
  const existingPendingInterest = crop.interests?.find(
    interest => interest.buyerUid === user.uid && interest.status === 'pending'
  );
  
  if (existingPendingInterest) {
    throw new ApiError(409, 'You already have a pending interest on this crop', 'DUPLICATE_INTEREST');
  }
  
  const validation = validateInterestData({ requestedQuantity }, crop.quantity);
  if (!validation.isValid) {
    throw new ApiError(400, validation.errors.join(', '), 'VALIDATION_ERROR');
  }
  
  const newInterest = {
    _id: new ObjectId(),
    buyerUid: user.uid,
    buyerEmail: user.email,
    buyerName: user.name,
    buyerPhoto: user.photoURL,
    requestedQuantity: parseFloat(requestedQuantity),
    message: message?.trim() || '',
    status: 'pending',
    createdAt: new Date(),
    processedAt: null
  };
  
  await cropsCollection.updateOne(
    { _id: new ObjectId(cropId) },
    { 
      $push: { interests: newInterest },
      $set: { updatedAt: new Date() }
    }
  );
  
  res.status(201).json({
    success: true,
    message: 'Interest submitted successfully',
    data: newInterest
  });
});


export const acceptInterest = asyncHandler(async (req, res) => {
  const { cropId, interestId } = req.params;
  const { user } = req;
  
  if (!ObjectId.isValid(cropId) || !ObjectId.isValid(interestId)) {
    throw new ApiError(400, 'Invalid ID format', 'INVALID_ID');
  }
  
  const cropsCollection = getCollection('crops');
  const usersCollection = getCollection('users');
  
  const crop = await cropsCollection.findOne({ _id: new ObjectId(cropId) });
  
  if (!crop) {
    throw new ApiError(404, 'Crop not found', 'CROP_NOT_FOUND');
  }

  if (crop.owner.uid !== user.uid) {
    throw new ApiError(403, 'Only the crop owner can accept interests', 'UNAUTHORIZED');
  }
  const interest = crop.interests?.find(
    i => i._id.toString() === interestId
  );
  
  if (!interest) {
    throw new ApiError(404, 'Interest not found', 'INTEREST_NOT_FOUND');
  }
  

  if (interest.status !== 'pending') {
    throw new ApiError(400, `Interest has already been ${interest.status}`, 'INTEREST_ALREADY_PROCESSED');
  }
  

  if (interest.requestedQuantity > crop.quantity) {
    throw new ApiError(400, 'Not enough quantity available', 'INSUFFICIENT_QUANTITY');
  }
  
  const newQuantity = crop.quantity - interest.requestedQuantity;
  const newStatus = newQuantity === 0 ? 'sold_out' : 'available';
  
  const result = await cropsCollection.findOneAndUpdate(
    { 
      _id: new ObjectId(cropId),
      'interests._id': new ObjectId(interestId),
      'interests.status': 'pending'
    },
    {
      $set: {
        quantity: newQuantity,
        status: newStatus,
        'interests.$.status': 'accepted',
        'interests.$.processedAt': new Date(),
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );
  
  if (!result) {
    throw new ApiError(400, 'Interest could not be processed. It may have already been processed.', 'UPDATE_FAILED');
  }
  

  await usersCollection.updateOne(
    { uid: interest.buyerUid },
    { $inc: { 'stats.totalPurchased': 1 } }
  );
  
  await usersCollection.updateOne(
    { uid: user.uid },
    { $inc: { 'stats.totalSold': 1 } }
  );
  
  const updatedInterest = result.interests.find(
    i => i._id.toString() === interestId
  );
  
  res.json({
    success: true,
    message: 'Interest accepted successfully',
    data: {
      interest: updatedInterest,
      crop: {
        _id: result._id,
        quantity: result.quantity,
        status: result.status
      }
    }
  });
});

export const rejectInterest = asyncHandler(async (req, res) => {
  const { cropId, interestId } = req.params;
  const { user } = req;
  
  if (!ObjectId.isValid(cropId) || !ObjectId.isValid(interestId)) {
    throw new ApiError(400, 'Invalid ID format', 'INVALID_ID');
  }
  
  const cropsCollection = getCollection('crops');
  
  const crop = await cropsCollection.findOne({ _id: new ObjectId(cropId) });
  
  if (!crop) {
    throw new ApiError(404, 'Crop not found', 'CROP_NOT_FOUND');
  }
  

  if (crop.owner.uid !== user.uid) {
    throw new ApiError(403, 'Only the crop owner can reject interests', 'UNAUTHORIZED');
  }
  
  const interest = crop.interests?.find(
    i => i._id.toString() === interestId
  );
  
  if (!interest) {
    throw new ApiError(404, 'Interest not found', 'INTEREST_NOT_FOUND');
  }
  

  if (interest.status !== 'pending') {
    throw new ApiError(400, `Interest has already been ${interest.status}`, 'INTEREST_ALREADY_PROCESSED');
  }
  
  const result = await cropsCollection.findOneAndUpdate(
    { 
      _id: new ObjectId(cropId),
      'interests._id': new ObjectId(interestId),
      'interests.status': 'pending'
    },
    {
      $set: {
        'interests.$.status': 'rejected',
        'interests.$.processedAt': new Date(),
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  );
  
  if (!result) {
    throw new ApiError(400, 'Interest could not be processed', 'UPDATE_FAILED');
  }
  
  const updatedInterest = result.interests.find(
    i => i._id.toString() === interestId
  );
  
  res.json({
    success: true,
    message: 'Interest rejected',
    data: updatedInterest
  });
});

export const getMyInterests = asyncHandler(async (req, res) => {
  const { user } = req;
  const { status, page = 1, limit = 10 } = req.query;
  
  const cropsCollection = getCollection('crops');
  
  const matchConditions = {
    'interests.buyerUid': user.uid
  };
  
  const pipeline = [

    { $match: matchConditions },
    { $unwind: '$interests' },
    { $match: { 'interests.buyerUid': user.uid } },
    ...(status && interestStatus.includes(status) 
      ? [{ $match: { 'interests.status': status } }] 
      : []
    ),
    { $sort: { 'interests.createdAt': -1 } },
    {
      $project: {
        _id: '$interests._id',
        cropId: '$_id',
        cropTitle: '$title',
        cropImage: '$imageUrl',
        cropCategory: '$category',
        cropLocation: '$location',
        cropPricePerUnit: '$pricePerUnit',
        cropUnit: '$unit',
        cropStatus: '$status',
        owner: '$owner',
        requestedQuantity: '$interests.requestedQuantity',
        message: '$interests.message',
        status: '$interests.status',
        createdAt: '$interests.createdAt',
        processedAt: '$interests.processedAt'
      }
    },
    { $skip: (parseInt(page) - 1) * parseInt(limit) },
    { $limit: parseInt(limit) }
  ];
  
  const countPipeline = [
    { $match: matchConditions },
    { $unwind: '$interests' },
    { $match: { 'interests.buyerUid': user.uid } },
    ...(status && interestStatus.includes(status) 
      ? [{ $match: { 'interests.status': status } }] 
      : []
    ),
    { $count: 'total' }
  ];
  
  const [interests, countResult] = await Promise.all([
    cropsCollection.aggregate(pipeline).toArray(),
    cropsCollection.aggregate(countPipeline).toArray()
  ]);
  
  const totalCount = countResult[0]?.total || 0;
  
  res.json({
    success: true,
    data: interests,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount,
      hasMore: (parseInt(page) - 1) * parseInt(limit) + interests.length < totalCount
    }
  });
});

export const cancelInterest = asyncHandler(async (req, res) => {
  const { cropId, interestId } = req.params;
  const { user } = req;
  
  if (!ObjectId.isValid(cropId) || !ObjectId.isValid(interestId)) {
    throw new ApiError(400, 'Invalid ID format', 'INVALID_ID');
  }
  
  const cropsCollection = getCollection('crops');

  const crop = await cropsCollection.findOne({ _id: new ObjectId(cropId) });
  
  if (!crop) {
    throw new ApiError(404, 'Crop not found', 'CROP_NOT_FOUND');
  }
  
  const interest = crop.interests?.find(
    i => i._id.toString() === interestId
  );
  
  if (!interest) {
    throw new ApiError(404, 'Interest not found', 'INTEREST_NOT_FOUND');
  }
  

  if (interest.buyerUid !== user.uid) {
    throw new ApiError(403, 'You can only cancel your own interests', 'UNAUTHORIZED');
  }
  
  if (interest.status !== 'pending') {
    throw new ApiError(400, `Cannot cancel an interest that has been ${interest.status}`, 'CANNOT_CANCEL');
  }
  
  await cropsCollection.updateOne(
    { _id: new ObjectId(cropId) },
    { 
      $pull: { interests: { _id: new ObjectId(interestId) } },
      $set: { updatedAt: new Date() }
    }
  );
  
  res.json({
    success: true,
    message: 'Interest cancelled successfully'
  });
});

/**
 * @route   GET /api/interests/:cropId
 * @desc    Get all interests for a specific crop
 * @access  Private (Owner only)
 */
export const getCropInterests = asyncHandler(async (req, res) => {
  const { cropId } = req.params;
  const { user } = req;
  const { status } = req.query;
  
  if (!ObjectId.isValid(cropId)) {
    throw new ApiError(400, 'Invalid crop ID', 'INVALID_ID');
  }
  
  const cropsCollection = getCollection('crops');
  
  const crop = await cropsCollection.findOne({ _id: new ObjectId(cropId) });
  
  if (!crop) {
    throw new ApiError(404, 'Crop not found', 'CROP_NOT_FOUND');
  }
  
  // Only owner can see all interests
  if (crop.owner.uid !== user.uid) {
    throw new ApiError(403, 'Only the crop owner can view all interests', 'UNAUTHORIZED');
  }
  
  let interests = crop.interests || [];
  
  // Filter by status if provided
  if (status && interestStatus.includes(status)) {
    interests = interests.filter(i => i.status === status);
  }
  
  // Sort by creation date (newest first)
  interests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({
    success: true,
    data: interests,
    stats: {
      total: crop.interests?.length || 0,
      pending: crop.interests?.filter(i => i.status === 'pending').length || 0,
      accepted: crop.interests?.filter(i => i.status === 'accepted').length || 0,
      rejected: crop.interests?.filter(i => i.status === 'rejected').length || 0
    }
  });
});
