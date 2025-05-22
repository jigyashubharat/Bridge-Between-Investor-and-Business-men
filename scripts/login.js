// Import Firebase services
import { auth, db } from './firebase.js';

// Get login form
const loginForm = document.getElementById('login-form');

// Handle form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get form values
        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;

        try {
            // Sign in user
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Get user type from database
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Save user type
                localStorage.setItem('userType', userData.userType);
                
                // Redirect based on user type
                if (userData.userType === 'investor') {
                    window.location.href = './proposals.html';
                } else if (userData.userType === 'business') {
                    window.location.href = './create-proposal.html';
                } else {
                    window.location.href = './dashboard.html';
                }
            }
        } catch (error) {
            // Show error message
            alert(error.message);
        }
    });
} 