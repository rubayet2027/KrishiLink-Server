/**
 * User Schema Definition
 * 
 * This file defines the structure for users in the KrishiLink platform.
 * Users are identified by their Firebase UID.
 * 
 * @collection users
 */

/**
 * User Document Structure:
 * {
 *   _id: ObjectId,
 *   uid: String (required, unique) - Firebase UID
 *   email: String (required, unique) - User's email
 *   name: String - Display name
 *   photoURL: String - Profile photo URL
 *   phone: String - Contact phone number
 *   address: {
 *     division: String,
 *     district: String,
 *     upazila: String,
 *     village: String,
 *     details: String
 *   },
 *   role: String (enum: 'farmer', 'buyer', 'both') - Default: 'both'
 *   farmDetails: {
 *     farmName: String,
 *     farmSize: Number - In acres
 *     farmType: String - Type of farming
 *     mainCrops: [String] - Primary crops grown
 *   },
 *   isVerified: Boolean (default: false) - Verification status
 *   rating: {
 *     average: Number (default: 0) - Average rating (0-5)
 *     count: Number (default: 0) - Number of ratings
 *   },
 *   stats: {
 *     totalPosts: Number (default: 0),
 *     totalSold: Number (default: 0),
 *     totalPurchased: Number (default: 0)
 *   },
 *   createdAt: Date,
 *   updatedAt: Date,
 *   lastLoginAt: Date
 * }
 */

// MongoDB Index Recommendations:
// 1. { uid: 1 } - Unique index for Firebase UID lookups
// 2. { email: 1 } - Unique index for email lookups

export const userRoles = ['farmer', 'buyer', 'both'];

export const bangladeshDivisions = [
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Sylhet',
  'Rangpur',
  'Mymensingh'
];

/**
 * Validation helper for user profile data
 */
export const validateUserData = (data) => {
  const errors = [];

  if (data.name && data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (data.phone && !/^(\+880|880|0)?1[3-9]\d{8}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.push('Invalid Bangladesh phone number');
  }

  if (data.role && !userRoles.includes(data.role)) {
    errors.push(`Role must be one of: ${userRoles.join(', ')}`);
  }

  if (data.address?.division && !bangladeshDivisions.includes(data.address.division)) {
    errors.push(`Division must be one of: ${bangladeshDivisions.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create initial user document from Firebase user
 */
export const createUserDocument = (firebaseUser) => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.name || firebaseUser.displayName || '',
    photoURL: firebaseUser.picture || firebaseUser.photoURL || '',
    phone: '',
    address: {
      division: '',
      district: '',
      upazila: '',
      village: '',
      details: ''
    },
    role: 'both',
    farmDetails: {
      farmName: '',
      farmSize: 0,
      farmType: '',
      mainCrops: []
    },
    isVerified: false,
    rating: {
      average: 0,
      count: 0
    },
    stats: {
      totalPosts: 0,
      totalSold: 0,
      totalPurchased: 0
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date()
  };
};
