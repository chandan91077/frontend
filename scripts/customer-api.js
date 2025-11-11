// ✅ FIXED: Use direct URL instead of import.meta
const API_BASE_URL = 'https://bakend-88v1.onrender.com';

let products = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeCustomerPortal();
});

async function initializeCustomerPortal() {
    await loadProductsFromDB();
    
    if (document.getElementById('featuredProducts')) {
        loadFeaturedProducts();
    }
    
    if (document.getElementById('productsGrid')) {
        loadAllProducts();
        setupSearchFilter();
    }
    
    if (document.getElementById('productDetail')) {
        loadProductDetail();
    }
    
    if (window.location.pathname.includes('cart.html')) {
        displayCart();
    }
    
    if (window.location.pathname.includes('checkout.html')) {
        if (!authService.requireLogin()) return;
        displayOrderSummary();
    }
    
    if (window.location.pathname.includes('orders.html')) {
        if (!authService.requireLogin()) return;
        await loadCustomerOrders();
    }
}

// ✅ Add to cart (no API update required)
function addToCart(productId, quantity = 1) {
    if (!authService.isCustomer()) {
        if (confirm('You need to login to add items to cart. Would you like to login now?')) {
            localStorage.setItem('returnUrl', window.location.href);
            window.location.href = 'login.html';
        }
        return;
    }

    const product = products.find(p => p.id === productId);
    
    if (product) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({...product, quantity});
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        alert('Product added to cart!');
        
        if (window.location.pathname.includes('cart.html')) {
            displayCart();
        }
    }
}

// ✅ Checkout API (updated)
async function processPayment() {
    if (!authService.requireLogin()) return;

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
        paymentMethod,
        totalAmount: total
    };

    try {
        console.log('Creating order, payload:', orderData);

        // ✅ ✅ FIXED: API BASE URL USED HERE
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify(orderData)
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            data = { raw: responseText };
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || `Server responded with ${response.status}`);
        }

        localStorage.removeItem('cart');
        updateCartCount();
        localStorage.setItem('lastOrderId', data.order.orderId);
        window.location.href = 'order-success.html';
        
    } catch (error) {
        console.error('Order failed:', error);
        alert('Order failed: ' + error.message);
    }
}

// ✅ Load Products (updated API)
async function loadProductsFromDB() {
    try {
        // ✅ ✅ FIXED: USE BASE URL
        const response = await fetch(`${API_BASE_URL}/api/medicines`);
        const medicines = await response.json();
        
        products = medicines.map(medicine => {
            const availableQty =
                medicine.availableQty !== undefined
                    ? medicine.availableQty
                    : ((medicine.totalQty || 0) - (medicine.soldQty || 0));
            
            return {
                id: medicine._id,
                name: medicine.name,
                category: medicine.category,
                price: medicine.price,
                description: medicine.description || '',
                dosage: medicine.dosage || '',
                image: window.resolveMedicineImage ? window.resolveMedicineImage(medicine) : (medicine.image || '💊'),
                quantity: availableQty,
                batchNumber: medicine.batchNumber,
                expiryDate: medicine.expiryDate
            };
        });
    } catch (error) {
        console.error('Failed to load products:', error);
        products = [];
    }
}

// Add other missing functions that your code references
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featuredProducts');
    if (!featuredContainer) return;
    
    const featuredProducts = products.slice(0, 6);
    
    featuredContainer.innerHTML = featuredProducts.map(product => `
        <div class="product-card">
            <div class="product-image">${product.image}</div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-price">₹${product.price}</p>
                <button onclick="addToCart('${product.id}')" class="btn btn-primary">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// Make functions globally available
window.addToCart = addToCart;
window.processPayment = processPayment;
window.updateCartCount = updateCartCount;
