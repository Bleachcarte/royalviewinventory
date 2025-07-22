// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCmcgPtGQ740vzt87V3bxdRUI4hoRIuKFw",
  authDomain: "royal-view-inventory.firebaseapp.com",
  projectId: "royal-view-inventory",
  storageBucket: "royal-view-inventory.firebasestorage.app",
  messagingSenderId: "715418380346",
  appId: "1:715418380346:web:3d11155b9e807456b36d03",
  measurementId: "G-DBKSF19PGE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Only initialize analytics in the browser (prevents SSR errors)
if (typeof window !== 'undefined') {
  getAnalytics(app);
}