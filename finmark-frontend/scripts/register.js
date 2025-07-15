// Registration Script - scripts/register.js

document.addEventListener('DOMContentLoaded', function() {
    // Redirect if already authenticated
    authService.redirectIfAuthenticated();
    
    // Get form elements
    const registerForm = document.getElementById('registerForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const passwordInput = document.getElementById('password');
    
    // Add password strength indicator
    addPasswordStrengthIndicator();
    
    // Handle password input for strength checking
    passwordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
    });
    
    // Handle form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearFieldErrors();
        
        // Get form data
        const formData = new FormData(this);
        const data = {
            full_name: formData.get('full_name').trim(),
            email: formData.get('email').trim().toLowerCase(),
            password: formData.get('password')
        };
        
        // Validate form
        const validationErrors = validateRegistrationForm(data, formData.get('confirmPassword'));
        
        if (Object.keys(validationErrors).length > 0) {
            // Show validation errors
            Object.keys(validationErrors).forEach(field => {
                showFieldError(field, validationErrors[field]);
            });
            return;
        }
        
        // Check terms agreement
        const termsChecked = document.getElementById('terms').checked;
        if (!termsChecked) {
            showFieldError('terms', 'You must agree to the terms');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            // Attempt registration
            const result = await authService.register(data);
            
            if (result.success) {
                // Show success message
                showRegistrationSuccess();
                
                // Auto-login after successful registration
                setTimeout(async () => {
                    const loginResult = await authService.login({
                        email: data.email,
                        password: data.password
                    });
                    
                    if (loginResult.success) {
                        window.showNotification('Registration successful! Redirecting to dashboard...', 'success');
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1500);
                    }
                }, 1000);
            } else {
                // Show error message
                window.showNotification(result.error || 'Registration failed. Please try again.', 'error');
                setLoadingState(false);
            }
        } catch (error) {
            console.error('Registration error:', error);
            window.showNotification('An error occurred. Please try again.', 'error');
            setLoadingState(false);
        }
    });
    
    // Validate registration form
    function validateRegistrationForm(data, confirmPassword) {
        const errors = {};
        
        // Validate full name
        const nameError = validateField('fullName', data.full_name);
        if (nameError) errors.fullName = nameError;
        
        // Validate email
        const emailError = validateField('email', data.email);
        if (emailError) errors.email = emailError;
        
        // Validate password
        const passwordError = validateField('password', data.password);
        if (passwordError) errors.password = passwordError;
        
        // Validate confirm password
        const confirmError = validateField('confirmPassword', confirmPassword, data.password);
        if (confirmError) errors.confirmPassword = confirmError;
        
        return errors;
    }
    
    // Set loading state
    function setLoadingState(isLoading) {
        submitBtn.disabled = isLoading;
        btnText.textContent = isLoading ? 'Creating Account...' : 'Create Account';
        btnSpinner.classList.toggle('hidden', !isLoading);
        registerForm.classList.toggle('loading', isLoading);
    }
    
    // Add password strength indicator
    function addPasswordStrengthIndicator() {
        const passwordGroup = passwordInput.closest('.form-group');
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';
        strengthIndicator.innerHTML = `
            <span class="strength-bar"></span>
            <span class="strength-bar"></span>
            <span class="strength-bar"></span>
        `;
        
        // Insert after the hint
        const hint = passwordGroup.querySelector('.form-hint');
        hint.parentNode.insertBefore(strengthIndicator, hint.nextSibling);
    }
    
    // Update password strength indicator
    function updatePasswordStrength(password) {
        const strengthIndicator = document.querySelector('.password-strength');
        const strength = checkPasswordStrength(password);
        
        strengthIndicator.className = `password-strength ${strength}`;
    }
    
    // Show registration success
    function showRegistrationSuccess() {
        const authCard = document.querySelector('.auth-card');
        authCard.innerHTML = `
            <div class="auth-success">
                <div class="success-icon">✓</div>
                <h3>Welcome to FinMark!</h3>
                <p>Your account has been created successfully.</p>
                <p>Logging you in automatically...</p>
                <div class="spinner dark" style="margin: 0 auto;"></div>
            </div>
        `;
    }
});