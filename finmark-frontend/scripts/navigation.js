document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            
            // Animate hamburger menu
            const spans = navToggle.querySelectorAll('span');
            if (mobileMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translateY(8px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translateY(-8px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navToggle.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.remove('active');
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
    
    // Update navigation based on authentication status
    updateNavigation();
});

// Check authentication status and update navigation
function updateNavigation() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.email) {
        // User is logged in
        const navLinks = document.querySelector('.nav-links');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        if (navLinks) {
            // Update desktop navigation
            const loginLink = navLinks.querySelector('a[href="login.html"]');
            const registerLink = navLinks.querySelector('a[href="register.html"]');
            
            if (loginLink) {
                loginLink.href = 'dashboard.html';
                loginLink.textContent = 'Dashboard';
                loginLink.classList.remove('btn-outline');
            }
            
            if (registerLink) {
                registerLink.href = '#';
                registerLink.textContent = 'Logout';
                registerLink.classList.remove('btn-primary');
                registerLink.classList.add('btn-danger', 'btn-small');
                registerLink.onclick = handleLogout;
            }
        }
        
        if (mobileMenu) {
            // Update mobile navigation
            const mobileLoginLink = mobileMenu.querySelector('a[href="login.html"]');
            const mobileRegisterLink = mobileMenu.querySelector('a[href="register.html"]');
            
            if (mobileLoginLink) {
                mobileLoginLink.href = 'dashboard.html';
                mobileLoginLink.textContent = 'Dashboard';
            }
            
            if (mobileRegisterLink) {
                mobileRegisterLink.href = '#';
                mobileRegisterLink.textContent = 'Logout';
                mobileRegisterLink.onclick = handleLogout;
            }
        }
    }
}

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Show logout message
    showNotification('Logged out successfully', 'success');
    
    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fade-in`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    // Add icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'i'
    };
    
    const iconColors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    notification.innerHTML = `
        <span style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background: ${iconColors[type]};
            color: white;
            border-radius: 50%;
            font-weight: bold;
            font-size: 14px;
        ">${icons[type]}</span>
        <span style="color: #1F2937;">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Export functions for use in other scripts
window.showNotification = showNotification;
window.updateNavigation = updateNavigation;