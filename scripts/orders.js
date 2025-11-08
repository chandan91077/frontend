// Orders management for customer

let allOrders = [];
let ordersPollingInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    
    // Check if user is logged in
    if (!authService.isCustomer()) {
        const ordersList = document.getElementById('ordersList');
        if (ordersList) {
            ordersList.innerHTML = `
                <div class="error-message">
                    <h3>Please Login</h3>
                    <p>You need to login to view your order history.</p>
                    <a href="login.html" class="btn btn-primary">Login Now</a>
                </div>
            `;
        }
        return;
    }
    
    loadCustomerOrders();
    // Start polling for order updates every 10 seconds while on this page
    if (document.getElementById('ordersList')) {
        ordersPollingInterval = setInterval(() => {
            loadCustomerOrders().catch(err => console.error('Polling error:', err));
        }, 10000); // 10s
    }
});

// Clear polling when leaving the page
window.addEventListener('beforeunload', function() {
    if (ordersPollingInterval) {
        clearInterval(ordersPollingInterval);
        ordersPollingInterval = null;
    }
});

async function loadCustomerOrders() {
    try {
        console.log('Loading customer orders...');

        // Check if user is logged in through auth service
        if (!authService.isCustomer()) {
            throw new Error('Please login to view your orders');
        }

        // ✅ Fixed backend API URL here
        const response = await fetch('https://bakend-88v1.onrender.com/api/customer/orders', {
            method: 'GET',
            headers: authService.getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to fetch orders: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Orders loaded:', data);
        
        allOrders = Array.isArray(data) ? data : [];
        displayOrders(allOrders);
        
    } catch (error) {
        console.error('Failed to load orders:', error);
        
        // Show error message to user
        const ordersList = document.getElementById('ordersList');
        if (ordersList) {
            ordersList.innerHTML = `
                <div class="error-message">
                    <h3>Unable to load orders</h3>
                    <p>${error.message || 'Please try refreshing the page or contact support if the problem continues.'}</p>
                    <button onclick="loadCustomerOrders()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
        
        const emptyOrders = document.getElementById('emptyOrders');
        if (emptyOrders) {
            emptyOrders.style.display = 'none';
        }
    }
}

// Rest of the functions remain the same...
function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    const emptyOrders = document.getElementById('emptyOrders');
    
    if (!ordersList || !emptyOrders) return;
    
    if (!orders || orders.length === 0) {
        if (ordersList) ordersList.style.display = 'none';
        if (emptyOrders) emptyOrders.style.display = 'block';
        return;
    }
    
    if (emptyOrders) emptyOrders.style.display = 'none';
    if (ordersList) ordersList.style.display = 'block';
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card" data-status="${order.orderStatus}">
            <div class="order-header">
                <div class="order-info">
                    <span class="order-id">Order #${order.orderId}</span>
                    <span class="order-date">Placed on ${new Date(order.createdAt).toLocaleDateString()}</span>
                    <span class="order-amount">Total: ₹${order.totalAmount}</span>
                </div>
                <div class="order-actions">
                    <span class="order-status status-${order.orderStatus}">${formatStatus(order.orderStatus)}</span>
                    <a href="order-tracking.html?orderId=${order.orderId}" class="btn btn-sm btn-outline">Track Order</a>
                </div>
            </div>
            
            <div class="order-items">
                <strong>Items:</strong>
                ${order.items.map(item => `
                    <div class="order-item">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">Qty: ${item.quantity}</span>
                        <span class="item-price">₹${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-footer">
                <div class="shipping-info">
                    <strong>Shipping to:</strong> ${order.shippingAddress.name}, ${order.shippingAddress.city}
                </div>
                <div class="payment-info">
                    <strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </div>
            </div>
        </div>
    `).join('');
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
}

function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    if (statusFilter === 'all') {
        displayOrders(allOrders);
    } else {
        const filteredOrders = allOrders.filter(order => order.orderStatus === statusFilter);
        displayOrders(filteredOrders);
    }
}

// Update cart count function
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}
