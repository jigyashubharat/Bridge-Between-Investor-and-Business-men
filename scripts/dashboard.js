// Import Firebase services and auth functions
import { db } from './firebase.js';
import { getCurrentUser, getUserType } from './auth.js';

// Get DOM elements
const userNameElement = document.getElementById('user-name');
const userRoleElement = document.getElementById('user-role');
const totalProposalsElement = document.getElementById('total-proposals');
const activeInvestmentsElement = document.getElementById('active-investments');
const unreadMessagesElement = document.getElementById('unread-messages');
const activityFeedElement = document.getElementById('activity-feed');

// Get dashboard sections
const investorLinks = document.getElementById('investor-links');
const businessLinks = document.getElementById('business-links');
const advisorLinks = document.getElementById('advisor-links');

// Get forms
const profileForm = document.getElementById('profile-form');
const proposalForm = document.getElementById('proposal-form');

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Main function to initialize dashboard
async function initializeDashboard() {
    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) {
        // Redirect to login if not logged in
        window.location.href = '/login.html';
        return;
    }

    // Load user profile
    await loadUserProfile(user);
    
    // Show role-specific sections
    await showRoleSpecificSections();
    
    // Load dashboard data
    await loadDashboardData();
    
    // Set up event listeners
    setupEventListeners();
}

// Function to load user profile
async function loadUserProfile(user) {
    try {
        // Get user data from database
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Update profile elements
            if (userNameElement) {
                userNameElement.textContent = userData.name || user.email;
            }
            if (userRoleElement) {
                userRoleElement.textContent = userData.userType || 'User';
            }
            
            // Fill profile form if it exists
            if (profileForm) {
                profileForm.displayName.value = userData.name || '';
                profileForm.bio.value = userData.bio || '';
                profileForm.phone.value = userData.phone || '';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('Error loading profile', 'error');
    }
}

// Function to show role-specific sections
async function showRoleSpecificSections() {
    const userType = await getUserType();
    
    // Hide all role sections first
    if (investorLinks) investorLinks.style.display = 'none';
    if (businessLinks) businessLinks.style.display = 'none';
    if (advisorLinks) advisorLinks.style.display = 'none';
    
    // Show sections based on user type
    switch (userType) {
        case 'investor':
            if (investorLinks) investorLinks.style.display = 'block';
            break;
        case 'business':
            if (businessLinks) businessLinks.style.display = 'block';
            break;
        case 'advisor':
            if (advisorLinks) advisorLinks.style.display = 'block';
            break;
    }
}

// Function to load dashboard data
async function loadDashboardData() {
    const user = getCurrentUser();
    if (!user) return;

    try {
        // Load total proposals
        const proposalsSnapshot = await db.collection('proposals').get();
        if (totalProposalsElement) {
            totalProposalsElement.textContent = proposalsSnapshot.size;
        }

        // Load active investments (for investors)
        const userType = await getUserType();
        if (userType === 'investor') {
            const investmentsSnapshot = await db.collection('investments')
                .where('investorId', '==', user.uid)
                .where('status', '==', 'active')
                .get();
            
            if (activeInvestmentsElement) {
                activeInvestmentsElement.textContent = investmentsSnapshot.size;
            }
        }

        // Load recent activity
        await loadRecentActivity(user.uid);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage('Error loading dashboard data', 'error');
    }
}

// Function to load recent activity
async function loadRecentActivity(userId) {
    if (!activityFeedElement) return;

    try {
        // Get recent activities from database
        const activitiesSnapshot = await db.collection('activities')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        // Clear current activity feed
        activityFeedElement.innerHTML = '';

        // Add activities to feed
        activitiesSnapshot.forEach(doc => {
            const activity = doc.data();
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            activityElement.innerHTML = `
                <p>${activity.description}</p>
                <small>${formatDate(activity.timestamp)}</small>
            `;
            activityFeedElement.appendChild(activityElement);
        });
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// Function to set up event listeners
function setupEventListeners() {
    // Profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Proposal form submission
    if (proposalForm) {
        proposalForm.addEventListener('submit', handleProposalSubmit);
    }

    // Dashboard navigation
    const navLinks = document.querySelectorAll('.dashboard-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
}

// Function to handle profile updates
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) return;

    try {
        // Get form data
        const formData = {
            name: profileForm.displayName.value,
            bio: profileForm.bio.value,
            phone: profileForm.phone.value,
            updatedAt: new Date()
        };

        // Update user profile in database
        await db.collection('users').doc(user.uid).update(formData);
        
        // Update profile display
        if (userNameElement) {
            userNameElement.textContent = formData.name;
        }

        showMessage('Profile updated successfully', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Error updating profile', 'error');
    }
}

// Function to handle proposal submission
async function handleProposalSubmit(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) return;

    try {
        // Get form data
        const formData = {
            title: proposalForm.title.value,
            description: proposalForm.description.value,
            amount: parseFloat(proposalForm.amount.value),
            category: proposalForm.category.value,
            userId: user.uid,
            status: 'pending',
            createdAt: new Date()
        };

        // Add proposal to database
        await db.collection('proposals').add(formData);
        
        // Reset form
        proposalForm.reset();
        
        // Show success message
        showMessage('Proposal submitted successfully', 'success');
        
        // Reload dashboard data
        await loadDashboardData();
    } catch (error) {
        console.error('Error submitting proposal:', error);
        showMessage('Error submitting proposal', 'error');
    }
}

// Function to handle navigation
function handleNavigation(event) {
    event.preventDefault();
    
    // Get target section
    const targetId = event.target.getAttribute('href').substring(1);
    
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update active link
    const links = document.querySelectorAll('.dashboard-nav a');
    links.forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Function to format date
function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to show messages
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type}`;
    messageDiv.textContent = message;

    const main = document.querySelector('main');
    if (main) {
        main.insertBefore(messageDiv, main.firstChild);
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
} 