// Updated customer functionality with authentication requirement

let products = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeCustomerPortal();
});

async function initializeCustomerPortal() {
    await loadProductsFromDB();
    
    // Load featured products on home page
    if (document.getElementById('featuredProducts')) {
        loadFeaturedProducts();
    }
    
    // Load all products on products page
    if (document.getElementById('productsGrid')) {
        loadAllProducts();
        setupSearchFilter();
    }
    
    // Load product detail if on product detail page
    if (document.getElementById('productDetail')) {
        loadProductDetail();
    }
    
    // Load cart display if on cart page
    if (window.location.pathname.includes('cart.html')) {
        displayCart();
    }
    
    // Check authentication for checkout page
    if (window.location.pathname.includes('checkout.html')) {
        if (!authService.requireLogin()) {
            return; // Redirect to login page
        }
        displayOrderSummary();
    }
    
    // Check authentication for orders page
    if (window.location.pathname.includes('orders.html')) {
        if (!authService.requireLogin()) {
            return; // Redirect to login page
        }
        await loadCustomerOrders();
    }
}

// Update add to cart to show login prompt
function addToCart(productId, quantity = 1) {
    if (!authService.isCustomer()) {
        if (confirm('You need to login to add items to cart. Would you like to login now?')) {
            localStorage.setItem('returnUrl', window.location.href);
            window.location.href = 'login.html';
        }
        return;
    }

    // Existing add to cart logic
    const product = products.find(p => p.id === productId);
    
    if (product) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                ...product,
                quantity: quantity
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        alert('Product added to cart!');
        
        if (window.location.pathname.includes('cart.html')) {
            displayCart();
        }
    }
}

// Update checkout process to require authentication
async function processPayment() {
    if (!authService.requireLogin()) {
        return;
    }

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

    const formData = new FormData(shippingForm);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    const orderData = {
        items: cart.map(item => ({
            // Cart may store id as `id` or `_id` depending on where it was added—support both
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

    try {
        console.log('Creating order, payload:', orderData);

        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify(orderData)
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { raw: responseText };
        }

        if (!response.ok) {
            console.error('Order creation failed, status:', response.status, 'body:', data);
            throw new Error(data.error || data.message || `Server responded with ${response.status}`);
        }

        console.log('Order created successfully:', data);

        // Clear cart and redirect to success page
        localStorage.removeItem('cart');
        updateCartCount();
        localStorage.setItem('lastOrderId', data.order.orderId);
        window.location.href = 'order-success.html';
        
    } catch (error) {
        console.error('Order failed:', error);
        alert('Order failed: ' + error.message + '\nOpen browser console for more details.');
    }
}

// Rest of the existing functions remain the same...
async function loadProductsFromDB() {
    try {
        const response = await fetch('http://localhost:3000/api/medicines');
        const medicines = await response.json();
        
        products = medicines.map(medicine => ({
            id: medicine._id,
            name: medicine.name,
            category: medicine.category,
            price: medicine.price,
            description: medicine.description,
            dosage: medicine.dosage,
            image: '💊',
            quantity: medicine.quantity,
            batchNumber: medicine.batchNumber,
            expiryDate: medicine.expiryDate
        }));
    } catch (error) {
        console.error('Failed to load products:', error);
        products = [];
    }
}