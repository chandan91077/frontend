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
                <div class="user-dropdown" id="userDropdownContainer">
                    <button class="user-greeting dropdown-toggle" id="dropdownToggle" type="button">
                        Hello, ${this.user.name}
                    </button>
                    <div class="dropdown-content" id="dropdownMenu">
                        <a href="orders.html">My Orders</a>
                        <a href="#" id="logoutLink">Logout</a>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                const toggle = document.getElementById('dropdownToggle');
                const menu = document.getElementById('dropdownMenu');
                const logoutLink = document.getElementById('logoutLink');
                
                if (toggle && menu) {
                    toggle.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        menu.classList.toggle('show');
                    });
                    
                    document.addEventListener('click', (e) => {
                        if (!e.target.closest('#userDropdownContainer')) {
                            menu.classList.remove('show');
                        }
                    });
                }
                
                if (logoutLink) {
                    logoutLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.logout();
                    });
                }
            }, 100);
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