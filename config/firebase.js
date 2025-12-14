import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initialize Firebase Admin SDK
 * 
 * This uses environment variables to configure the service account.
 * In production (Vercel), these are set in the environment.
 */

const getFirebaseConfig = () => {
  // Check if running in production with environment variables
  if (process.env.FIREBASE_PROJECT_ID) {
    return {
      type: process.env.FIREBASE_TYPE || 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };
  }
  
  return null;
};

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  const firebaseConfig = getFirebaseConfig();
  
  if (firebaseConfig && firebaseConfig.project_id) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
    console.log('✅ Firebase Admin initialized with service account');
  } else {
    // Fallback for development - may use default credentials
    admin.initializeApp();
    console.log('⚠️ Firebase Admin initialized with default credentials');
  }
}

export default admin;
