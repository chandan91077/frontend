// Authentication management for customers

class AuthService {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    isLoggedIn() {
        return !!this.token && !!this.user;
    }

    isCustomer() {
        return this.isLoggedIn() && this.user.role === 'customer';
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('isCustomerLoggedIn');
        this.token = null;
        this.user = null;
        window.location.href = 'index.html';
    }

    requireLogin(redirectUrl = 'login.html') {
        if (!this.isCustomer()) {
            // Store the current URL to return after login
            localStorage.setItem('returnUrl', window.location.href);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    updateNavigation() {
        const authSection = document.getElementById('authSection');
        if (!authSection) return;

        if (this.isCustomer()) {
            authSection.innerHTML = `
                <div class="user-dropdown">
                    <span class="user-greeting dropdown-toggle">Hello, ${this.user.name}</span>
                    <div class="dropdown-content">
                        <a href="orders.html">My Orders</a>
                        <a href="#" onclick="authService.logout(); return false;">Logout</a>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                const dropdown = authSection.querySelector('.user-dropdown');
                const toggle = authSection.querySelector('.dropdown-toggle');
                const content = authSection.querySelector('.dropdown-content');
                
                if (toggle && content) {
                    toggle.addEventListener('click', function(e) {
                        e.stopPropagation();
                        content.classList.toggle('show');
                    });
                    
                    if (!this._dropdownClickHandlerAdded) {
                        document.addEventListener('click', function(event) {
                            const allDropdowns = document.querySelectorAll('.dropdown-content.show');
                            allDropdowns.forEach(dropdown => {
                                if (!dropdown.closest('.user-dropdown').contains(event.target)) {
                                    dropdown.classList.remove('show');
                                }
                            });
                        });
                        this._dropdownClickHandlerAdded = true;
                    }
                }
            }, 0);
        } else {
            authSection.innerHTML = `
                <a href="login.html" class="nav-link">Login/Signup</a>
            `;
        }
    }

    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async makeAuthenticatedRequest(url, options = {}) {
        if (!this.isCustomer()) {
            throw new Error('Authentication required');
        }

        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }
}

// Create global auth service instance
const authService = new AuthService();

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
    authService.updateNavigation();
});