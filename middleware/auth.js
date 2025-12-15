import admin from '../config/firebase.js';
import { getCollection } from '../config/database.js';
import { createUserDocument } from '../models/User.js';


export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.displayName || '',
      photoURL: decodedToken.picture || '',
      emailVerified: decodedToken.email_verified
    };
    
    // Ensure user exists in MongoDB (upsert on first login)
    await ensureUserExists(req.user);
    
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      code: 'AUTH_FAILED'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.displayName || '',
      photoURL: decodedToken.picture || '',
      emailVerified: decodedToken.email_verified
    };
    
    next();
  } catch (error) {
    // Token invalid, but we allow the request to continue
    req.user = null;
    next();
  }
};


const ensureUserExists = async (firebaseUser) => {
  try {
    const usersCollection = getCollection('users');
    
    const existingUser = await usersCollection.findOne({ uid: firebaseUser.uid });
    
    if (!existingUser) {
      // Create new user document
      const newUser = createUserDocument(firebaseUser);
      await usersCollection.insertOne(newUser);
      console.log(`✅ New user created: ${firebaseUser.email}`);
    } else {
      // Update last login time
      await usersCollection.updateOne(
        { uid: firebaseUser.uid },
        { 
          $set: { 
            lastLoginAt: new Date(),
            // Update name and photo if changed in Firebase
            ...(firebaseUser.name && { name: firebaseUser.name }),
            ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL })
          }
        }
      );
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error.message);
  }
};
