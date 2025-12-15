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
