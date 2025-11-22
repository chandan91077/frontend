// Payment processing with Cashfree

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    displayOrderSummary();
});

function displayOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;
    
    orderSummary.innerHTML = `
        ${cart.map(item => `
            <div class="order-review-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('')}
        <div class="order-review-item">
            <span>Subtotal</span>
            <span>₹${subtotal.toFixed(2)}</span>
        </div>
        <div class="order-review-item">
            <span>Shipping</span>
            <span>₹${shipping.toFixed(2)}</span>
        </div>
        <div class="order-review-item" style="font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px;">
            <span>Total</span>
            <span>₹${total.toFixed(2)}</span>
        </div>
    `;
}

async function processPayment() {
    const shippingForm = document.getElementById('shippingForm');
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (!shippingForm.checkValidity()) {
        alert('Please fill in all required shipping information.');
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    if (paymentMethod === 'cod') {
        // Handle Cash on Delivery
        await placeOrder('cod');
    } else {
        // Handle Cashfree payment
        // For now create the order on backend and then simulate payment flow
        await processCashfreePayment();
    }
}

async function processCashfreePayment() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 500 ? 0 : 50;
        const total = subtotal + shipping;
        
        console.log('🚀 Starting Cashfree payment process for amount:', total);

        // Create a Cashfree payment order via backend
        const created = await createCashfreeOrder(total);
        if (!created) {
            console.error('❌ Failed to create Cashfree order');
            return;
        }

        // Get payment link from response
        if (!created.paymentLink) {
            console.error('❌ No payment link in response:', created);
            alert('Failed to create payment session. Please try again.');
            return;
        }

        // Store order ID for verification and redirect to payment page
        if (created.order && created.order.orderId) {
            localStorage.setItem('lastOrderId', created.order.orderId);
            console.log('✅ Order created:', created.order.orderId);
            console.log('🔗 Redirecting to payment gateway:', created.paymentLink);
            
            // ✅ Add a small delay to ensure localStorage is written
            setTimeout(() => {
                console.log('🔄 Redirecting now...');
                window.location.href = created.paymentLink;
            }, 800);
        } else {
            alert('Invalid order response from server');
        }
    } catch (error) {
        console.error('❌ Payment processing error:', error);
        alert('Payment processing failed. Please try again.');
    }
}

// Simulate backend order creation (replace with actual API call)
async function simulateBackendOrderCreation(amount) {
    // This is a simulation - in real app, call your backend API
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate a mock payment session ID
            const mockSessionId = 'mock_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            resolve(mockSessionId);
        }, 1000);
    });
}

async function placeOrder(paymentMethod) {
    // Create order on backend (requires authentication)
    const created = await createBackendOrder(paymentMethod);
    if (created) {
        // Clear cart
        localStorage.removeItem('cart');
        updateCartCount();

        // Redirect to order confirmation
        localStorage.setItem('lastOrderId', created.order.orderId);
        window.location.href = 'order-success.html';
    } else {
        alert('Failed to place order. See console for details.');
    }
}

// Helper: create order on backend with auth headers
async function createBackendOrder(paymentMethod) {
    try {
        if (!authService.requireLogin()) return null;

        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return null;
        }

        const formData = new FormData(document.getElementById('shippingForm'));
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 500 ? 0 : 50;
        const total = subtotal + shipping;

        const orderPayload = {
            items: cart.map(item => ({
                medicine: item._id || item.id || item.medicine,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            shippingAddress: {
                name: `${formData.get('firstName')} ${formData.get('lastName')}`,
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                pincode: formData.get('pincode')
            },
            paymentMethod: paymentMethod,
            totalAmount: total
        };

        console.log('Sending order to backend:', orderPayload);

       const response = await fetch('https://bakend-88v1.onrender.com/api/orders', {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify(orderPayload)
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

        if (!response.ok) {
            console.error('Backend order creation failed', response.status, data);
            let errorMessage = data.error || data.message || 'Order creation failed';
            
            // Show detailed error if stock validation failed
            if (data.details && Array.isArray(data.details)) {
                errorMessage += '\n\n' + data.details.join('\n');
            }
            
            alert(errorMessage);
            return null;
        }

        console.log('Backend order created', data);
        return data;
    } catch (err) {
        console.error('Error creating backend order', err);
        alert('Error creating order: ' + err.message);
        return null;
    }
}

// Create Cashfree payment order via backend endpoint (secure)
async function createCashfreeOrder(amount) {
    try {
        if (!authService.requireLogin()) return null;

        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const formData = new FormData(document.getElementById('shippingForm'));
        const shippingAddress = {
            name: `${formData.get('firstName')} ${formData.get('lastName')}`,
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            pincode: formData.get('pincode')
        };

        const payload = {
            items: cart.map(item => ({
                medicine: item._id || item.id || item.medicine,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            shippingAddress,
            totalAmount: amount
        };

        console.log('📤 Sending payment order to backend:', payload);

        const response = await fetch('https://bakend-88v1.onrender.com/api/payments/cashfree/create-order', {
            method: 'POST',
            headers: Object.assign({ 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }, authService.getAuthHeaders()),
            body: JSON.stringify(payload)
        });

        let data;
        try {
            const text = await response.text();
            console.log('📥 Raw server response:', text);
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse server response:', e);
                throw new Error('Invalid response from server');
            }

            if (!response.ok) {
                const errorMessage = data.message || data.error || 'Payment initialization failed';
                const errorDetails = data.details ? `\n\nDetails: ${JSON.stringify(data.details)}` : '';
                throw new Error(`${errorMessage}${errorDetails}`);
            }

            // Validate response has required fields
            if (!data.paymentLink) {
                console.error('❌ Invalid server response - missing payment link:', data);
                throw new Error('Server response missing payment link');
            }

            console.log('✅ Payment order created successfully');
            return data;
        } catch (error) {
            console.error('Payment creation failed:', error, data);
            alert(error.message || 'Failed to create payment. Please try again.');
            return null;
        }
    } catch (err) {
        console.error('Error creating cashfree order on backend', err);
        alert('Failed to initiate payment: ' + err.message);
        return null;
    }
}

// Attempt to find a payment URL in the backend response (handles multiple variants)
function extractPaymentLink(resp) {
    if (!resp) return null;

    // direct top-level link
    if (typeof resp.paymentLink === 'string' && resp.paymentLink) return resp.paymentLink;
    if (typeof resp.payment_link === 'string' && resp.payment_link) return resp.payment_link;
    if (typeof resp.paymentLinkUrl === 'string' && resp.paymentLinkUrl) return resp.paymentLinkUrl;

    // nested cfResponse handling
    const cf = resp.cfResponse || resp.data || resp;
    if (!cf) return null;

    // If cf has data object
    const data = cf.data || cf;
    const candidates = [
        data.payment_link,
        data.paymentLink,
        data.paymentLinkUrl,
        data.payment_link_url,
        cf.payment_link,
        cf.paymentLink,
        cf.paymentLinkUrl
    ];

    for (const c of candidates) {
        if (typeof c === 'string' && c) return c;
    }

    // Some Cashfree responses include a 'gateway' or 'checkout' url
    if (data.gateway_url) return data.gateway_url;
    if (data.checkout_url) return data.checkout_url;

    return null;
}
