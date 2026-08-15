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
