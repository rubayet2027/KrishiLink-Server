import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initialize Firebase Admin SDK
 * 
 * Supports two methods:
 * 1. FB_SERVICE_KEY - Base64 encoded service account JSON (recommended for Vercel)
 * 2. Individual FIREBASE_* env vars (fallback)
 */

const getFirebaseConfig = () => {
  // Method 1: Base64 encoded service key (preferred for Vercel)
  if (process.env.FB_SERVICE_KEY) {
    try {
      const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString("utf8");
      const serviceAccount = JSON.parse(decoded);
      return serviceAccount;
    } catch (error) {
      console.error('❌ Error decoding FB_SERVICE_KEY:', error.message);
    }
  }

  // Method 2: Individual environment variables (fallback)
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('❌ Firebase credentials not found in environment variables');
    return null;
  }

  return {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: 'googleapis.com'
  };
};

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  const firebaseConfig = getFirebaseConfig();
  
  if (firebaseConfig) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
  } else {
    console.error('❌ Firebase Admin could not be initialized - missing credentials');
  }
}

export default admin;
