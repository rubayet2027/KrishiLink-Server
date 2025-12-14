/**
 * Crop Schema Definition
 * 
 * This file defines the structure for crops in the KrishiLink platform.
 * Interests are embedded within each crop document for atomic operations.
 * 
 * @collection crops
 */

/**
 * Crop Document Structure:
 * {
 *   _id: ObjectId,
 *   title: String (required) - Name of the crop
 *   description: String (required) - Detailed description
 *   category: String (required) - Category (vegetables, fruits, grains, etc.)
 *   quantity: Number (required) - Available quantity in kg
 *   unit: String (default: 'kg') - Unit of measurement
 *   pricePerUnit: Number (required) - Price per unit in BDT
 *   location: String (required) - Farm/seller location
 *   harvestDate: Date - Expected or actual harvest date
 *   imageUrl: String - URL to crop image
 *   isOrganic: Boolean (default: false) - Organic certification
 *   owner: {
 *     uid: String (required) - Firebase UID
 *     email: String (required) - Owner's email
 *     name: String - Owner's display name
 *     photoURL: String - Owner's profile photo
 *   },
 *   interests: [
 *     {
 *       _id: ObjectId - Auto-generated interest ID
 *       buyerUid: String (required) - Firebase UID of interested buyer
 *       buyerEmail: String (required) - Buyer's email
 *       buyerName: String - Buyer's display name
 *       buyerPhoto: String - Buyer's profile photo
 *       requestedQuantity: Number (required) - Quantity requested
 *       message: String - Optional message from buyer
 *       status: String (enum: 'pending', 'accepted', 'rejected') - Default: 'pending'
 *       createdAt: Date - When interest was submitted
 *       processedAt: Date - When interest was accepted/rejected
 *     }
 *   ],
 *   status: String (enum: 'available', 'sold_out', 'expired') - Default: 'available'
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

// MongoDB Index Recommendations:
// 1. { "owner.uid": 1 } - For fetching user's posts
// 2. { "interests.buyerUid": 1 } - For fetching user's interests
// 3. { category: 1, status: 1 } - For filtering crops
// 4. { createdAt: -1 } - For sorting by newest

export const cropCategories = [
  'vegetables',
  'fruits',
  'grains',
  'pulses',
  'spices',
  'dairy',
  'poultry',
  'fish',
  'other'
];

export const cropStatus = ['available', 'sold_out', 'expired'];

export const interestStatus = ['pending', 'accepted', 'rejected'];

export const units = ['kg', 'gram', 'ton', 'piece', 'dozen', 'liter'];

/**
 * Validation helper for crop data
 */
export const validateCropData = (data) => {
  const errors = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  if (!data.category || !cropCategories.includes(data.category)) {
    errors.push(`Category must be one of: ${cropCategories.join(', ')}`);
  }

  if (!data.quantity || data.quantity <= 0) {
    errors.push('Quantity must be a positive number');
  }

  if (!data.pricePerUnit || data.pricePerUnit <= 0) {
    errors.push('Price per unit must be a positive number');
  }

  if (!data.location || data.location.trim().length < 2) {
    errors.push('Location is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validation helper for interest data
 */
export const validateInterestData = (data, availableQuantity) => {
  const errors = [];

  if (!data.requestedQuantity || data.requestedQuantity <= 0) {
    errors.push('Requested quantity must be a positive number');
  }

  if (data.requestedQuantity > availableQuantity) {
    errors.push(`Requested quantity exceeds available quantity (${availableQuantity})`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
