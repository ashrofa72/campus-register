import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrKvG7v4OR4F54Xdz5wcS5J1fyCUaSOU4",
  authDomain: "campus-register.firebaseapp.com",
  projectId: "campus-register",
  storageBucket: "campus-register.appspot.com",
  messagingSenderId: "556026618098",
  appId: "1:556026618098:web:1d60f5cfec26512d9cf06b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Enable Firestore offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // This can happen if multiple tabs are open.
      console.warn('Firestore persistence failed, likely due to multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support the required features.
      console.warn('Firestore persistence is not supported in this browser.');
    }
  });

export { auth, db };