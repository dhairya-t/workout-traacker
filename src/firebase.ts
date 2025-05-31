import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Debug: Check environment variables (safe way)
console.log('🔧 Firebase Environment Check:');
console.log('API Key loaded:', !!process.env.REACT_APP_FIREBASE_API_KEY);
console.log('Project ID loaded:', !!process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('Auth Domain loaded:', !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
console.log('All env vars present:', !!(
  process.env.REACT_APP_FIREBASE_API_KEY &&
  process.env.REACT_APP_FIREBASE_PROJECT_ID &&
  process.env.REACT_APP_FIREBASE_AUTH_DOMAIN &&
  process.env.REACT_APP_FIREBASE_STORAGE_BUCKET &&
  process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID &&
  process.env.REACT_APP_FIREBASE_APP_ID
));

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  const configured = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    firebaseConfig.projectId !== 'your-project-id'
  );
  
  console.log('🔧 Firebase Config Valid:', configured);
  return configured;
};

// Initialize Firebase only if properly configured
let app: FirebaseApp | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('🔥 Firebase initialized - USING CLOUD STORAGE');
} else {
  console.log('⚠️ Firebase not configured - USING LOCALSTORAGE FALLBACK');
}

export { db, isFirebaseConfigured };
export default app; 