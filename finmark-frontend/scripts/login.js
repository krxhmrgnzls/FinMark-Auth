document.addEventListener('DOMContentLoaded', function() {
    // Redirect if already authenticated
    authService.redirectIfAuthenticated();
    
    // Get form elements
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');
    
    // Auto-fill demo credentials on click
    setupDemoCredentials();
    
    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberCheckbox.checked = true;
    }
    
    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearFieldErrors();
        
        // Get form data
        const formData = new FormData(this);
        const credentials = {
            email: formData.get('email').trim().toLowerCase(),
            password: formData.get('password')
        };
        
        // Validate form
        const validationErrors = validateLoginForm(credentials);
        
        if (Object.keys(validationErrors).length > 0) {
            // Show validation errors
            Object.keys(validationErrors).forEach(field => {
                showFieldError(field, validationErrors[field]);
            });
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        // Track login start time
        const startTime = Date.now();
        
        try {
            // Attempt login
            const result = await authService.login(credentials);
            
            if (result.success) {
                // Calculate login time
                const loginTime = Date.now() - startTime;
                
                // Handle remember me
                if (rememberCheckbox.checked) {
                    localStorage.setItem('rememberedEmail', credentials.email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
                
                // Show success with timing
                showLoginSuccess(loginTime, result.data.loginTime);
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                // Show error message
                window.showNotification(result.error || 'Invalid email or password', 'error');
                setLoadingState(false);
                
                // Add shake animation to form
                loginForm.classList.add('shake');
                setTimeout(() => loginForm.classList.remove('shake'), 500);
            }
        } catch (error) {
            console.error('Login error:', error);
            window.showNotification('An error occurred. Please try again.', 'error');
            setLoadingState(false);
        }
    });
    
    // Validate login form
    function validateLoginForm(credentials) {
        const errors = {};
        
        // Validate email
        const emailError = validateField('email', credentials.email);
        if (emailError) errors.email = emailError;
        
        // Validate password
        if (!credentials.password) {
            errors.password = 'Password is required';
        }
        
        return errors;
    }
    
    // Set loading state
    function setLoadingState(isLoading) {
        submitBtn.disabled = isLoading;
        btnText.textContent = isLoading ? 'Signing In...' : 'Sign In';
        btnSpinner.classList.toggle('hidden', !isLoading);
        loginForm.classList.toggle('loading', isLoading);
    }
    
    // Show login success
    function showLoginSuccess(clientTime, serverTime) {
        const authCard = document.querySelector('.auth-card');
        authCard.innerHTML = `
            <div class="auth-success">
                <div class="success-icon">✓</div>
                <h3>Login Successful!</h3>
                <p>Authentication completed in <strong>${serverTime || clientTime + 'ms'}</strong></p>
                <p>Redirecting to your dashboard...</p>
                <div class="spinner dark" style="margin: 0 auto;"></div>
            </div>
        `;
        
        // Show notification
        window.showNotification(`Welcome back! Login completed in ${serverTime || clientTime + 'ms'}`, 'success');
    }
    
    // Setup demo credentials
    function setupDemoCredentials() {
        const credentialBox = document.querySelector('.credential-box');
        if (credentialBox) {
            credentialBox.style.cursor = 'pointer';
            credentialBox.addEventListener('click', function() {
                emailInput.value = 'demo@finmark.com';
                passwordInput.value = 'Demo123!';
                
                // Visual feedback
                this.style.background = 'var(--bg-tertiary)';
                setTimeout(() => {
                    this.style.background = '';
                }, 300);
                
                window.showNotification('Demo credentials filled', 'info');
            });
        }
    }
});

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .shake {
        animation: shake 0.5s ease-in-out;
    }
    
    .performance-comparison {
        margin: var(--spacing-xl) 0;
    }
    
    .comparison-item {
        margin-bottom: var(--spacing-lg);
    }
    
    .comparison-item h4 {
        font-size: var(--font-size-base);
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary);
    }
    
    .performance-metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
    }
    
    .metric-value.old {
        color: var(--danger-color);
        font-weight: 600;
    }
    
    .metric-value.new {
        color: var(--success-color);
        font-weight: 600;
    }
    
    .performance-bar {
        height: 8px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-full);
        overflow: hidden;
    }
    
    .performance-bar .bar-fill {
        height: 100%;
        transition: width 1s ease;
        animation: fillBar 1.5s ease forwards;
    }
    
    .old-bar .bar-fill {
        background: var(--danger-color);
    }
    
    .new-bar .bar-fill {
        background: var(--success-color);
    }
    
    @keyframes fillBar {
        from { width: 0 !important; }
    }
    
    .demo-credentials {
        background: var(--bg-tertiary);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        margin: var(--spacing-xl) 0;
    }
    
    .demo-credentials h4 {
        margin-bottom: var(--spacing-sm);
    }
    
    .credential-box {
        background: var(--bg-primary);
        border: 2px dashed var(--primary-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        margin-top: var(--spacing-sm);
        transition: all var(--transition-fast);
    }
    
    .credential-box:hover {
        border-style: solid;
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
    }
    
    .credential-box p {
        margin: var(--spacing-xs) 0;
        font-family: monospace;
        font-size: var(--font-size-sm);
    }
    
    .security-note {
        background: var(--bg-secondary);
        border-left: 4px solid var(--success-color);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-top: var(--spacing-xl);
    }
    
    .security-note p {
        margin: 0;
        font-size: var(--font-size-sm);
        line-height: 1.6;
    }
`;
document.head.appendChild(style);