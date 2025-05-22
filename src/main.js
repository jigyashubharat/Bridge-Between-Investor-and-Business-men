// Firebase configuration
const firebaseConfig = {
    // Your Firebase configuration will go here
    // You'll need to replace these with your actual Firebase project credentials
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const mainNav = document.getElementById('main-nav');
const navLinks = document.querySelector('.nav-links');

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        updateNavigationForLoggedInUser(user);
    } else {
        // User is signed out
        updateNavigationForLoggedOutUser();
    }
});

// Update navigation based on auth state
function updateNavigationForLoggedInUser(user) {
    const userType = localStorage.getItem('userType'); // 'investor', 'business', or 'advisor'
    
    // Clear existing navigation
    navLinks.innerHTML = '';
    
    // Add common links
    navLinks.innerHTML += `
        <a href="/" class="nav-link">Home</a>
        <a href="/profile" class="nav-link">Profile</a>
    `;
    
    // Add role-specific links
    switch(userType) {
        case 'investor':
            navLinks.innerHTML += `
                <a href="/investments" class="nav-link">My Investments</a>
                <a href="/proposals" class="nav-link">View Proposals</a>
            `;
            break;
        case 'business':
            navLinks.innerHTML += `
                <a href="/my-proposals" class="nav-link">My Proposals</a>
                <a href="/create-proposal" class="nav-link">Create Proposal</a>
            `;
            break;
        case 'advisor':
            navLinks.innerHTML += `
                <a href="/queries" class="nav-link">View Queries</a>
                <a href="/post-advice" class="nav-link">Post Advice</a>
            `;
            break;
    }
    
    // Add logout link
    navLinks.innerHTML += `
        <a href="#" class="nav-link" id="logout-link">Logout</a>
    `;
    
    // Add logout event listener
    document.getElementById('logout-link').addEventListener('click', handleLogout);
}

function updateNavigationForLoggedOutUser() {
    navLinks.innerHTML = `
        <a href="/" class="nav-link">Home</a>
        <a href="/about" class="nav-link">About</a>
        <a href="/login" class="nav-link">Login</a>
        <a href="/register" class="nav-link">Register</a>
    `;
}

// Handle logout
async function handleLogout(e) {
    e.preventDefault();
    try {
        await auth.signOut();
        localStorage.removeItem('userType');
        window.location.href = '/';
    } catch (error) {
        console.error('Error signing out:', error);
        showAlert('Error signing out. Please try again.', 'error');
    }
}

// Utility function to show alerts
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insert alert at the top of the main content
    const main = document.querySelector('main');
    main.insertBefore(alertDiv, main.firstChild);
    
    // Remove alert after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Handle form submissions
document.addEventListener('submit', async (e) => {
    if (e.target.matches('form')) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const formType = e.target.dataset.formType;
        
        try {
            switch(formType) {
                case 'login':
                    await handleLogin(formData);
                    break;
                case 'register':
                    await handleRegistration(formData);
                    break;
                case 'proposal':
                    await handleProposalSubmission(formData);
                    break;
                // Add more form handlers as needed
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showAlert(error.message, 'error');
        }
    }
});

// Login handler
async function handleLogin(formData) {
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user type from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            localStorage.setItem('userType', userDoc.data().userType);
            window.location.href = '/dashboard';
        } else {
            throw new Error('User profile not found');
        }
    } catch (error) {
        throw new Error('Invalid email or password');
    }
}

// Registration handler
async function handleRegistration(formData) {
    const email = formData.get('email');
    const password = formData.get('password');
    const userType = formData.get('userType');
    const name = formData.get('name');
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await db.collection('users').doc(user.uid).set({
            name,
            email,
            userType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        localStorage.setItem('userType', userType);
        window.location.href = '/dashboard';
    } catch (error) {
        throw new Error('Registration failed. Please try again.');
    }
}

// Proposal submission handler
async function handleProposalSubmission(formData) {
    const title = formData.get('title');
    const description = formData.get('description');
    const amount = formData.get('amount');
    const category = formData.get('category');
    
    const user = auth.currentUser;
    if (!user) {
        throw new Error('You must be logged in to submit a proposal');
    }
    
    try {
        await db.collection('proposals').add({
            title,
            description,
            amount: parseFloat(amount),
            category,
            userId: user.uid,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert('Proposal submitted successfully!', 'success');
        window.location.href = '/my-proposals';
    } catch (error) {
        throw new Error('Failed to submit proposal. Please try again.');
    }
}

// Initialize mobile navigation
function initMobileNav() {
    const mobileNavButton = document.createElement('button');
    mobileNavButton.className = 'mobile-nav-button';
    mobileNavButton.innerHTML = '☰';
    
    mobileNavButton.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });
    
    mainNav.insertBefore(mobileNavButton, navLinks);
}

// Initialize the application
function init() {
    initMobileNav();
    
    // Add any additional initialization code here
    console.log('Application initialized');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 