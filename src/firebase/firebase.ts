import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "decisive-upgrade-hlcf1",
  appId: "1:212666214483:web:cbd6670b6580a16da9fea6",
  apiKey: "AIzaSyCAgjXazl6r1Z55MC7RRhzmyPjra3T5ZK0",
  authDomain: "decisive-upgrade-hlcf1.firebaseapp.com",
  storageBucket: "decisive-upgrade-hlcf1.firebasestorage.app",
  messagingSenderId: "212666214483",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-d554e66c-5fb8-4b90-8874-f7511ff3d54c");
export const storage = getStorage(app);
