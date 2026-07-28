import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD9uWFuaX_xYPeeJkEM4VNuDN4wUIN4h_0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "homeapp-62b36.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "homeapp-62b36",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "homeapp-62b36.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "818858924264",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:818858924264:web:98eae17aad3ef3efbbd15d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-VMJKEXBVLZ",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: any;
  lastLoginAt: any;
}

export interface ExamHistoryItem {
  id?: string;
  userId: string;
  examId: string;
  examTitle: string;
  score: number;
  total: number;
  passed: boolean;
  scorePct: number;
  answers: Array<"O" | "X" | null>;
  finishedAt: number | any;
}

/**
 * Save user info to Firestore on login
 */
export async function syncUserProfile(user: User) {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  const userData: UserProfile = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLoginAt: serverTimestamp(),
    createdAt: userSnap.exists() ? userSnap.data().createdAt : serverTimestamp(),
  };

  await setDoc(userRef, userData, { merge: true });
}

/**
 * Save exam result for authenticated user
 */
export async function saveExamResult(userId: string, data: Omit<ExamHistoryItem, "userId">) {
  try {
    const examResultsRef = collection(db, "users", userId, "exam_results");
    await addDoc(examResultsRef, {
      ...data,
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving exam result to Firebase Firestore:", error);
  }
}

/**
 * Fetch exam history for a user
 */
export async function getUserExamHistory(userId: string): Promise<ExamHistoryItem[]> {
  try {
    const examResultsRef = collection(db, "users", userId, "exam_results");
    const q = query(examResultsRef, orderBy("finishedAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as ExamHistoryItem[];
  } catch (error) {
    console.error("Error fetching exam history:", error);
    return [];
  }
}
