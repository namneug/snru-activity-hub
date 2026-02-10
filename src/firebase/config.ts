import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDJwLqDSnNGQkYJla-6oMq-9dACXBz4U8s",
  authDomain: "snru-activity-hub.firebaseapp.com",
  projectId: "snru-activity-hub",
  storageBucket: "snru-activity-hub.firebasestorage.app",
  messagingSenderId: "460718483339",
  appId: "1:460718483339:web:276528aa766b7e43d9318e",
  measurementId: "G-CQ2Y3JDBLX"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
