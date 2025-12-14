import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

/**
 * MongoDB Client Configuration
 * 
 * Uses connection pooling for efficient database operations.
 * Configured for MongoDB Atlas with Server API v1.
 */
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 60000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});

let db = null;

/**
 * Connect to MongoDB and return the database instance
 */
export const connectDB = async () => {
  try {
    if (db) {
      return db;
    }
    
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    
    db = client.db('krishilink');
    console.log('✅ Connected to MongoDB - KrishiLink Database');
    
    // Create indexes for optimal query performance
    await createIndexes(db);
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

/**
 * Create database indexes for optimal performance
 */
const createIndexes = async (database) => {
  try {
    const cropsCollection = database.collection('crops');
    const usersCollection = database.collection('users');
    
    // Crop indexes
    await cropsCollection.createIndex({ 'owner.uid': 1 });
    await cropsCollection.createIndex({ 'interests.buyerUid': 1 });
    await cropsCollection.createIndex({ category: 1, status: 1 });
    await cropsCollection.createIndex({ createdAt: -1 });
    await cropsCollection.createIndex({ status: 1 });
    
    // User indexes
    await usersCollection.createIndex({ uid: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    // Indexes might already exist, which is fine
    if (error.code !== 85) {
      console.warn('⚠️ Index creation warning:', error.message);
    }
  }
};

/**
 * Get the database instance
 */
export const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
};

/**
 * Get a specific collection
 */
export const getCollection = (collectionName) => {
  const database = getDB();
  return database.collection(collectionName);
};

/**
 * Close the database connection
 */
export const closeDB = async () => {
  try {
    await client.close();
    db = null;
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

export default client;
