import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FB_DB_URL,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
};

let app = null;
let db = null;

export function getFirebaseDB() {
  if (typeof window === 'undefined') return null;
  if (!firebaseConfig.databaseURL) return null;
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getDatabase(app);
    }
    return db;
  } catch (e) {
    console.warn('Firebase init failed:', e);
    return null;
  }
}
