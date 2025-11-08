// ✅ Use .env base URL
const API_BASE_URL = 'https://bakend-88v1.onrender.com';

// Order tracking functionality
let trackingPollInterval = null;

async function fetchOrderById(orderId) {
    if (!orderId) throw new Error('Order ID is required');

    // Authenticated customers use the protected endpoint
    if (authService.isCustomer()) {
        return await authService.makeAuthenticatedRequest(
            `${API_BASE_URL}/api/orders/${orderId}`
        );
    }

    // Guests use the public tracking endpoint
    const res = await fetch(`${API_BASE_URL}/api/orders/track/${orderId}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to fetch order: ${res.statusText}`);
    }
    return await res.json();
}

async function trackOrder() {
    const orderId = document.getElementById('orderSearch').value.trim();
    const trackingResult = document.getElementById('trackingResult');
    const noTrackingResult = document.getElementById('noTrackingResult');

    if (!orderId) {
        alert('Please enter an Order ID');
        return;
    }

    try {
        const order = await fetchOrderById(orderId);
        displayTrackingResult(order);
        noTrackingResult.style.display = 'none';

        // Start polling for status updates every 8 seconds
        if (trackingPollInterval) clearInterval(trackingPollInterval);
        trackingPollInterval = setInterval(async () => {
            try {
                const updated = await fetchOrderById(orderId);
                displayTrackingResult(updated);
            } catch (err) {
                console.error('Tracking poll error:', err);
            }
        }, 8000);

    } catch (error) {
        trackingResult.style.display = 'none';
        noTrackingResult.style.display = 'block';
        console.error('Tracking error:', error);
    }
}

// Clear polling when leaving the page
window.addEventListener('beforeunload', function() {
    if (trackingPollInterval) {
        clearInterval(trackingPollInterval);
        trackingPollInterval = null;
    }
});

function displayTrackingResult(order) {
    const trackingResult = document.getElementById('trackingResult');
    
    const statusSteps = [
        { status: 'pending', label: 'Order Placed', description: 'Your order has been received' },
        { status: 'confirmed', label: 'Order Confirmed', description: 'We are preparing your order' },
        { status: 'shipped', label: 'Shipped', description: 'Your order is on the way' },
        { status: 'delivered', label: 'Delivered', description: 'Order delivered successfully' }
    ];

    const currentStatusIndex = statusSteps.findIndex(step => step.status === order.orderStatus);

    let trackingHTML = `
        <div class="order-tracking-card">
            <div class="tracking-header">
                <h3>Order #${order.orderId}</h3>
                <span class="order-status status-${order.orderStatus}">${order.orderStatus}</span>
            </div>
            
            <div class="order-summary">
                <div class="summary-item"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
                <div class="summary-item"><strong>Total Amount:</strong> ₹${order.totalAmount}</div>
                <div class="summary-item"><strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</div>
                <div class="summary-item"><strong>Payment Status:</strong> ${order.paymentStatus}</div>
            </div>

            <div class="tracking-timeline">
                <h4>Order Tracking</h4>
                <div class="timeline">
    `;

    statusSteps.forEach((step, index) => {
        const isCompleted = index <= currentStatusIndex;
        const isCurrent = index === currentStatusIndex;
        
        trackingHTML += `
            <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                <div class="timeline-marker">
                    ${isCompleted ? '✓' : (index + 1)}
                </div>
                <div class="timeline-content">
                    <div class="timeline-title">${step.label}</div>
                    <div class="timeline-description">${step.description}</div>
                    ${isCurrent && order.orderStatus === 'shipped' ? `
                        <div class="shipping-info">
                            <strong>Estimated Delivery:</strong> ${getEstimatedDeliveryDate(order.createdAt)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    trackingHTML += `
                </div>
            </div>

            <div class="order-items">
                <h4>Order Items</h4>
                ${order.items.map(item => `
                    <div class="tracking-order-item">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity">Qty: ${item.quantity}</span>
                        <span class="item-price">₹${item.price * item.quantity}</span>
                    </div>
                `).join('')}
            </div>

            <div class="shipping-address">
                <h4>Shipping Address</h4>
                <p>${order.shippingAddress.name}</p>
                <p>${order.shippingAddress.address}</p>
                <p>${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
                <p>Phone: ${order.shippingAddress.phone}</p>
                <p>Email: ${order.shippingAddress.email}</p>
            </div>
        </div>
    `;

    trackingResult.innerHTML = trackingHTML;
    trackingResult.style.display = 'block';
}

function getEstimatedDeliveryDate(orderDate) {
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    return deliveryDate.toLocaleDateString();
}

// Allow pressing Enter to track order
document.getElementById('orderSearch')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        trackOrder();
    }
});
