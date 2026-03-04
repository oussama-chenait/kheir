// Firebase Configuration
// IMPORTANT: Replace the config below with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDwW0SmDub2yMgy110AC60n2vxZQjlig60",
    authDomain: "oussama-kheir.firebaseapp.com",
    projectId: "oussama-kheir",
    storageBucket: "oussama-kheir.firebasestorage.app",
    messagingSenderId: "198603320265",
    appId: "1:198603320265:web:5b7447603636a8dc4e1618",
    measurementId: "G-41J7CSW6WS"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Export as global for simplicity in this project's structure
window.db = db;
window.auth = firebase.auth();
window.firebase = firebase;
