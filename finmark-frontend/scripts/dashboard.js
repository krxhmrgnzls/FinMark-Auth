document.addEventListener('DOMContentLoaded', function() {
    // Require authentication
    authService.requireAuth();
    
    // Load user data
    loadUserData();
    
    // Start session timer
    startSessionTimer();
    
    // Load activity log
    loadActivityLog();
    
    // Update performance metrics
    updateMetrics();
});

// Load user data
function loadUserData() {
    const user = authService.getUser();
    const loginTime = localStorage.getItem('loginTime');
    
    if (user) {
        // Update welcome message
        document.getElementById('userName').textContent = user.full_name || 'User';
        
        // Update profile information
        document.getElementById('userFullName').textContent = user.full_name || 'N/A';
        document.getElementById('userEmail').textContent = user.email || 'N/A';
        document.getElementById('userId').textContent = user.id || 'N/A';
        
        // Set user initial
        const initial = (user.full_name || user.email || 'U').charAt(0).toUpperCase();
        document.getElementById('userInitial').textContent = initial;
        
        // Set member since (demo date)
        const memberDate = new Date();
        memberDate.setDate(memberDate.getDate() - Math.floor(Math.random() * 30));
        document.getElementById('memberSince').textContent = memberDate.toLocaleDateString();
        
        // Update login time
        if (loginTime) {
            const loginDate = new Date(loginTime);
            document.getElementById('loginTimestamp').textContent = loginDate.toLocaleString();
        }
        
        // Show token preview
        const token = authService.getToken();
        if (token) {
            const tokenPreview = token.substring(0, 50) + '...';
            document.getElementById('tokenPreview').textContent = `Bearer ${tokenPreview}`;
        }
    }
}

// Start session timer
function startSessionTimer() {
    const updateTimer = () => {
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime) {
            const now = new Date();
            const login = new Date(loginTime);
            const diff = now - login;
            
            // Convert to minutes and hours
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            
            let duration = '';
            if (hours > 0) {
                duration = `${hours}h ${remainingMinutes}m`;
            } else {
                duration = `${minutes}m`;
            }
            
            document.getElementById('sessionDuration').textContent = duration;
        }
    };
    
    // Update immediately and then every minute
    updateTimer();
    setInterval(updateTimer, 60000);
}

// Load activity log
function loadActivityLog() {
    const activities = [
        { icon: '🔐', text: 'Logged in successfully', time: 'Just now' },
        { icon: '✓', text: 'Email verified', time: '2 minutes ago' },
        { icon: '🔄', text: 'Profile updated', time: '5 minutes ago' },
        { icon: '📊', text: 'Viewed analytics dashboard', time: '10 minutes ago' }
    ];
    
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item fade-in';
        item.innerHTML = `
            <span class="activity-icon">${activity.icon}</span>
            <div class="activity-details">
                <p>${activity.text}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;
        activityList.appendChild(item);
    });
}

// Update performance metrics
function updateMetrics() {
    // Simulate dynamic metrics
    const authSpeed = (Math.random() * 0.5 + 0.5).toFixed(1);
    document.getElementById('authSpeed').textContent = authSpeed + 's';
    
    // Update login time display
    const loginTimeDisplay = localStorage.getItem('lastLoginTime') || '0.8s';
    document.getElementById('loginTime').textContent = loginTimeDisplay;
    
    // Animate progress bars
    setTimeout(() => {
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            bar.style.width = bar.style.width || '93%';
        });
    }, 500);
}

// Handle profile edit (demo)
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn-outline') && e.target.textContent === 'Edit Profile') {
        e.preventDefault();
        window.showNotification('Profile editing coming soon!', 'info');
    }
});

// Periodic token verification
setInterval(async () => {
    const result = await authService.verifyToken();
    if (!result.success) {
        window.showNotification('Session expired. Please login again.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
}, 300000); // Check every 5 minutes