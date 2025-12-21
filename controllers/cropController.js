import { ObjectId } from 'mongodb';
import { connectDB, getCollection } from '../config/database.js';
import { validateCropData, cropStatus } from '../models/Crop.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

export const getAllCrops = asyncHandler(async (req, res) => {
  await connectDB();
  const cropsCollection = getCollection('crops');
  
  const {
    category,
    status = 'available',
    minPrice,
    maxPrice,
    location,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 12
  } = req.query;
  
  const filter = {};
  
  if (status && cropStatus.includes(status)) {
    filter.status = status;
  }
  
  if (category) {
    filter.category = category;
  }
  
  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }
  
  if (minPrice || maxPrice) {
    filter.pricePerUnit = {};
    if (minPrice) filter.pricePerUnit.$gte = parseFloat(minPrice);
    if (maxPrice) filter.pricePerUnit.$lte = parseFloat(maxPrice);
  }
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } } // for legacy compatibility
    ];
  }
  
  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Execute query
  const [crops, totalCount] = await Promise.all([
    cropsCollection
      .find(filter)
      .project({ interests: 0 }) // Exclude interests from list view
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray(),
    cropsCollection.countDocuments(filter)
  ]);
  
  res.json({
    success: true,
    data: crops,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount,
      hasMore: skip + crops.length < totalCount
    }
  });
});


export const getCropById = asyncHandler(async (req, res) => {
  await connectDB();
  const { id } = req.params;
  
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid crop ID', 'INVALID_ID');
  }
  
  const cropsCollection = getCollection('crops');
  const crop = await cropsCollection.findOne({ _id: new ObjectId(id) });
  
  if (!crop) {
    throw new ApiError(404, 'Crop not found', 'CROP_NOT_FOUND');
  }
  
  // Check if current user is the owner
  const isOwner = req.user && crop.owner.uid === req.user.uid;
  
  // Hide interests from non-owners, but keep count
  if (!isOwner) {
    const interestCount = crop.interests?.length || 0;
    const pendingCount = crop.interests?.filter(i => i.status === 'pending').length || 0;
    delete crop.interests;
    crop.interestCount = interestCount;
    crop.pendingInterestCount = pendingCount;
  }
  
  res.json({
    success: true,
    data: crop,
    isOwner
  });
});


export const createCrop = asyncHandler(async (req, res) => {
  await connectDB();
  const { user } = req;
  const cropData = req.body;
  
  // Debug: Log incoming cropData
  console.log('Incoming cropData:', JSON.stringify(cropData, null, 2));
  // Debug: Log incoming cropData and validation errors
  console.log('Incoming cropData:', JSON.stringify(cropData, null, 2));
  const validation = validateCropData(cropData);
  if (!validation.isValid) {
    console.error('Crop validation failed:', validation.errors);
    return res.status(400).json({
      success: false,
      message: validation.errors.join(', '),
      errors: validation.errors,
      debug: cropData
    });
  }

  const cropsCollection = getCollection('crops');
  const usersCollection = getCollection('users');


  // Always store images as an array
  let imagesArr = [];
  if (Array.isArray(cropData.images) && cropData.images.length > 0) {
    imagesArr = cropData.images.filter(img => typeof img === 'string' && img.trim().length > 0);
  } else if (typeof cropData.image === 'string' && cropData.image.trim().length > 0) {
    imagesArr = [cropData.image];
  }

  let newCrop = {
    ...cropData,
    images: imagesArr,
    interests: Array.isArray(cropData.interests) ? cropData.interests : [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // For compatibility, set image and imageUrl to first image if available
  if (imagesArr.length > 0) {
    newCrop.image = imagesArr[0];
    newCrop.imageUrl = imagesArr[0];
  }

  const result = await cropsCollection.insertOne(newCrop);

  // Update user's total posts count
  if (cropData.owner && cropData.owner.uid) {
    await usersCollection.updateOne(
      { uid: cropData.owner.uid },
      { $inc: { 'stats.totalPosts': 1 } }
    );
  }

  res.status(201).json({
    success: true,
    message: 'Crop listing created successfully',
    data: {
      _id: result.insertedId,
      ...newCrop
    }
  });
});


export const updateCrop = asyncHandler(async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { user } = req;
  const updateData = req.body;
  
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid crop ID', 'INVALID_ID');
  }
  
  const cropsCollection = getCollection('crops');
  
  // Find the crop and verify ownership
  const crop = await cropsCollection.findOne({ _id: new ObjectId(id) });
  
  if (!crop) {
    throw new ApiError(404, 'Crop not found', 'CROP_NOT_FOUND');
  }
  
  if (crop.owner.uid !== user.uid) {
    throw new ApiError(403, 'You are not authorized to update this crop', 'UNAUTHORIZED');
  }
  
  // Build update object (allow both legacy and new fields)
  const allowedUpdates = [
    'name', 'title', 'description', 'category', 'quantity', 'unit',
    'pricePerUnit', 'location', 'harvestDate', 'image', 'imageUrl', 'isOrganic', 'status'
  ];

  const updateFields = {};
  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      if (field === 'harvestDate' && updateData[field]) {
        updateFields[field] = new Date(updateData[field]);
      } else if (field === 'quantity' || field === 'pricePerUnit') {
        updateFields[field] = parseFloat(updateData[field]);
      } else if (field === 'isOrganic') {
        updateFields[field] = Boolean(updateData[field]);
      } else if (typeof updateData[field] === 'string') {
        updateFields[field] = updateData[field].trim();
      } else {
        updateFields[field] = updateData[field];
      }
    }
  }

  // If updating title, also update name for compatibility
  if (updateFields.title && !updateFields.name) {
    updateFields.name = updateFields.title;
  }
  if (updateFields.name && !updateFields.title) {
    updateFields.title = updateFields.name;
  }
  // If updating imageUrl, also update image
  if (updateFields.imageUrl && !updateFields.image) {
    updateFields.image = updateFields.imageUrl;
  }
  if (updateFields.image && !updateFields.imageUrl) {
    updateFields.imageUrl = updateFields.image;
  }
  
  updateFields.updatedAt = new Date();
  
  // Auto-update status if quantity becomes 0
  if (updateFields.quantity === 0) {
    updateFields.status = 'sold_out';
  }
  
  const result = await cropsCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateFields },
    { returnDocument: 'after' }
  );
  
  res.json({
    success: true,
    message: 'Crop updated successfully',
    data: result
  });
});


export const deleteCrop = asyncHandler(async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { user } = req;
  
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid crop ID', 'INVALID_ID');
  }
  
  const cropsCollection = getCollection('crops');
  const usersCollection = getCollection('users');
  
  // Find the crop and verify ownership
  const crop = await cropsCollection.findOne({ _id: new ObjectId(id) });
  
  if (!crop) {
    throw new ApiError(404, 'Crop not found', 'CROP_NOT_FOUND');
  }
  
  if (crop.owner.uid !== user.uid) {
    throw new ApiError(403, 'You are not authorized to delete this crop', 'UNAUTHORIZED');
  }
  
  await cropsCollection.deleteOne({ _id: new ObjectId(id) });
  
  // Decrement user's total posts count
  await usersCollection.updateOne(
    { uid: user.uid },
    { $inc: { 'stats.totalPosts': -1 } }
  );
  
  res.json({
    success: true,
    message: 'Crop deleted successfully'
  });
});

/**
 * @route   GET /api/crops/my-posts
 * @desc    Get all crops posted by the current user
 * @access  Private
 */
export const getMyPosts = asyncHandler(async (req, res) => {
  await connectDB();
  const { user } = req;
  const { status, page = 1, limit = 10 } = req.query;
  
  const cropsCollection = getCollection('crops');
  
  const filter = { 'owner.uid': user.uid };
  
  if (status && cropStatus.includes(status)) {
    filter.status = status;
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [crops, totalCount] = await Promise.all([
    cropsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray(),
    cropsCollection.countDocuments(filter)
  ]);
  
  // Add summary stats for each crop
  const cropsWithStats = crops.map(crop => ({
    ...crop,
    interestStats: {
      total: crop.interests?.length || 0,
      pending: crop.interests?.filter(i => i.status === 'pending').length || 0,
      accepted: crop.interests?.filter(i => i.status === 'accepted').length || 0,
      rejected: crop.interests?.filter(i => i.status === 'rejected').length || 0
    }
  }));
  
  res.json({
    success: true,
    data: cropsWithStats,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      totalCount,
      hasMore: skip + crops.length < totalCount
    }
  });
});

/**
 * @route   GET /api/crops/categories
 * @desc    Get list of all categories with counts
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res) => {
  await connectDB();
  const cropsCollection = getCollection('crops');
  
  const categories = await cropsCollection.aggregate([
    { $match: { status: 'available' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  res.json({
    success: true,
    data: categories.map(cat => ({
      name: cat._id,
      count: cat.count
    }))
  });
});
