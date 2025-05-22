// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAIIyAx2xIqykwg7FMQ3Ur1JI-05tBsOIM",
    authDomain: "bridge-4c7fd.firebaseapp.com",
    projectId: "bridge-4c7fd",
    storageBucket: "bridge-4c7fd.firebasestorage.app",
    messagingSenderId: "273208272760",
    appId: "1:273208272760:web:00bb377b933857eb468a8d",
    measurementId: "G-WKDTKMWFKL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Initialize Analytics (optional)
let analytics = null;
try {
    analytics = firebase.analytics();
} catch (error) {
    console.log('Analytics not available:', error);
}

// Export Firebase services
export { auth, db, analytics }; 