// Minimal auth.js for Firebase Auth integration
import { auth, db } from './firebase.js';

export function getCurrentUser() {
    return auth.currentUser;
}

export async function getUserType() {
    const user = getCurrentUser();
    if (!user) return null;
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            return userDoc.data().userType || null;
        }
        return null;
    } catch (error) {
        console.error('Error getting user type:', error);
        return null;
    }
} 