const API_BASE_URL = 'http://localhost:3000';

class AuthService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    // Register a new user
    async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            return { success: true, data };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Login user
    async login(credentials) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user data
            this.setSession(data.token, data.user);

            return { success: true, data };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout user
    async logout() {
        try {
            const token = this.getToken();
            
            if (token) {
                await fetch(`${this.baseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            }

            this.clearSession();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            this.clearSession();
            return { success: true }; // Clear session even if API call fails
        }
    }

    // Verify token
    async verifyToken() {
        try {
            const token = this.getToken();
            
            if (!token) {
                return { success: false, error: 'No token found' };
            }

            const response = await fetch(`${this.baseUrl}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                this.clearSession();
                throw new Error(data.error || 'Token verification failed');
            }

            return { success: true, data };
        } catch (error) {
            console.error('Token verification error:', error);
            return { success: false, error: error.message };
        }
    }

    // Session management
    setSession(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('loginTime', new Date().toISOString());
    }

    clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    // Redirect if authenticated
    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    }

    // Redirect if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
}

// Create global auth service instance
const authService = new AuthService();

// Form validation helpers
const validators = {
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    password: (password) => {
        return password.length >= 8;
    },
    
    fullName: (name) => {
        return name.trim().length >= 2;
    }
};

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
}

// Form field validation
function validateField(field, value, confirmValue = null) {
    let error = '';
    
    switch (field) {
        case 'email':
            if (!value) {
                error = 'Email is required';
            } else if (!validators.email(value)) {
                error = 'Please enter a valid email address';
            }
            break;
            
        case 'password':
            if (!value) {
                error = 'Password is required';
            } else if (!validators.password(value)) {
                error = 'Password must be at least 8 characters';
            }
            break;
            
        case 'confirmPassword':
            if (!value) {
                error = 'Please confirm your password';
            } else if (value !== confirmValue) {
                error = 'Passwords do not match';
            }
            break;
            
        case 'fullName':
            if (!value) {
                error = 'Full name is required';
            } else if (!validators.fullName(value)) {
                error = 'Please enter a valid name';
            }
            break;
            
        case 'terms':
            if (!value) {
                error = 'You must agree to the terms';
            }
            break;
    }
    
    return error;
}

// Show field error
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = message ? 'block' : 'none';
    }
    
    if (inputElement && message) {
        inputElement.classList.add('error');
    } else if (inputElement) {
        inputElement.classList.remove('error');
    }
}

// Clear all field errors
function clearFieldErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    const inputElements = document.querySelectorAll('.form-input');
    
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    inputElements.forEach(el => {
        el.classList.remove('error');
    });
}

// Toggle password visibility
function setupPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.password-toggle');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const eyeIcon = this.querySelector('.eye-icon');
            
            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.textContent = '👁️‍🗨️';
            } else {
                input.type = 'password';
                eyeIcon.textContent = '👁️';
            }
        });
    });
}

// Setup real-time validation
function setupRealtimeValidation() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            const fieldName = this.name;
            const value = this.value;
            let confirmValue = null;
            
            if (fieldName === 'confirmPassword') {
                confirmValue = document.getElementById('password')?.value;
            }
            
            const error = validateField(fieldName, value, confirmValue);
            showFieldError(this.id, error);
        });
        
        // Clear error on input
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                showFieldError(this.id, '');
            }
        });
    });
}

// Initialize auth features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggle();
    setupRealtimeValidation();
});

// Export for use in other scripts
window.authService = authService;
window.validateField = validateField;
window.showFieldError = showFieldError;
window.clearFieldErrors = clearFieldErrors;
window.checkPasswordStrength = checkPasswordStrength;