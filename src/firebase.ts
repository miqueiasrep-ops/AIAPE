import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  updateDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAvXhXqBgQDdRFY9Du6m-qCX3ZW-5jBp0E",
  authDomain: "gen-lang-client-0135824596.firebaseapp.com",
  projectId: "gen-lang-client-0135824596",
  storageBucket: "gen-lang-client-0135824596.firebasestorage.app",
  messagingSenderId: "482306767740",
  appId: "1:482306767740:web:2225d7380e3d4bc30a82f9"
};

const DATABASE_ID = "ai-studio-fluxodecaixainte-f91ed258-3d28-48f3-9a11-5820228e6cba";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore with custom Database ID
export const db = initializeFirestore(app, {}, DATABASE_ID);

/**
 * Recursively removes all `undefined` values from an object or nested structure.
 * Firestore strictly rejects documents with `undefined` values.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => cleanForFirestore(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object') {
        clean[key] = cleanForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}

export { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  updateDoc,
  onSnapshot,
  writeBatch
};
export type { FirebaseUser };
