// Shopping Cart functionality

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

async function addToCart(medicineId, quantity = 1) {
    try {
        // Check if user is logged in
        if (!authService.isCustomer()) {
            alert('Please login to add items to cart');
            localStorage.setItem('returnUrl', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        // Fetch medicine details from the server
        // ✅ CORRECT
        const response = await fetch(`https://bakend-88v1.onrender.com/api/medicines/${medicineId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch medicine details');
        }
        
        const medicine = await response.json();
        
        // Calculate available quantity (backend uses totalQty and soldQty)
        const availableQty = (medicine.availableQty !== undefined) 
            ? medicine.availableQty 
            : ((medicine.totalQty || 0) - (medicine.soldQty || 0));
        
        // Check if medicine exists and is in stock
        if (!medicine || availableQty <= 0) {
            alert('Sorry, this medicine is out of stock');
            return;
        }

        // Check if medicine is already in cart
        const existingItem = cart.find(item => item._id === medicineId);
        
        if (existingItem) {
            // Check if requested quantity is available
            if (existingItem.quantity + quantity > availableQty) {
                alert(`Sorry, only ${availableQty} units available in stock`);
                return;
            }
            existingItem.quantity += quantity;
            existingItem.maxQuantity = availableQty; // Update max quantity
        } else {
            // Add new item to cart
            cart.push({
                _id: medicine._id,
                name: medicine.name,
                price: medicine.price,
                image: medicine.image || '💊',
                category: medicine.category,
                quantity: quantity,
                maxQuantity: availableQty // Store available quantity
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        alert('Product added to cart!');
        
        // If on cart page, refresh the cart display
        if (window.location.pathname.includes('cart.html')) {
            displayCart();
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
    }
}

function removeFromCart(medicineId) {
    cart = cart.filter(item => item._id !== medicineId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    displayCart();
}

function updateQuantity(medicineId, change) {
    const item = cart.find(item => item._id === medicineId);
    
    if (item) {
        const newQuantity = item.quantity + change;
        
        // Check if new quantity is within limits
        if (newQuantity <= 0) {
            removeFromCart(medicineId);
        } else if (newQuantity <= item.maxQuantity) {
            item.quantity = newQuantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            displayCart();
        } else {
            alert('Sorry, not enough stock available');
        }
    }
}

function displayCart() {
    const cartContent = document.getElementById('cartContent');
    const emptyCart = document.getElementById('emptyCart');
    
    if (cart.length === 0) {
        if (cartContent) cartContent.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';
    
    if (cartContent) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        cartContent.innerHTML = `
            <div class="cart-items">
                ${cart.map(item => `
                    <div class="cart-item">
                        <div class="cart-item-image">
                            ${item.image ? 
                                `<img src="${item.image}" alt="${item.name}" class="medicine-thumbnail" onerror="if(window.handleImageError) window.handleImageError(this, '${item.category}')">` : 
                                `<img src="${window.createFallbackImage ? window.createFallbackImage() : ''}" alt="${item.name}" class="medicine-thumbnail">`}
                        </div>
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
                        </div>
                        <div class="cart-item-controls">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="updateQuantity('${item._id}', -1)">-</button>
                                <span class="quantity">${item.quantity}</span>
                                <button class="quantity-btn" onclick="updateQuantity('${item._id}', 1)">+</button>
                            </div>
                            <button class="remove-btn" onclick="removeFromCart('${item._id}')">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₹${total.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>₹${total > 500 ? '0.00' : '50.00'}</span>
                </div>
                <div class="summary-row summary-total">
                    <span>Total:</span>
                    <span>₹${(total + (total > 500 ? 0 : 50)).toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-full" onclick="proceedToCheckout()">Proceed to Checkout</button>
            </div>
        `;
    }
}

function proceedToCheckout() {
    if (!authService.isCustomer()) {
        alert('Please login to proceed with checkout');
        localStorage.setItem('returnUrl', window.location.href);
        window.location.href = 'login.html';
        return;
    }
    
    if (cart.length > 0) {
        window.location.href = 'checkout.html';
    } else {
        alert('Your cart is empty!');
    }
}

// Initialize cart display when on cart page
if (window.location.pathname.includes('cart.html')) {
    document.addEventListener('DOMContentLoaded', displayCart);
}
