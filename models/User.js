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
