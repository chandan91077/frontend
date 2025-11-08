// Customer portal JavaScript

// Will store products loaded from database
let products = [];

// Load products from database
async function loadProductsFromDB() {
    try {
        const response = await fetch('http://localhost:3000/api/medicines');
        if (!response.ok) {
            throw new Error('Failed to fetch medicines');
        }
        const medicines = await response.json();
        
        products = medicines.map(medicine => {
            // Calculate available quantity (backend returns availableQty or calculate from totalQty - soldQty)
            const availableQty = (medicine.availableQty !== undefined) 
                ? medicine.availableQty 
                : ((medicine.totalQty || 0) - (medicine.soldQty || 0));
            
            return {
                id: medicine._id,
                name: medicine.name,
                category: medicine.category,
                price: medicine.price,
                description: medicine.description || '',
                dosage: medicine.dosage || '',
                image: medicine.image || getCategoryIcon(medicine.category),
                quantity: availableQty
            };
        });
    } catch (error) {
        console.error('Failed to load products:', error);
        products = [];
    }
}

function getCategoryIcon(category) {
    switch (category.toLowerCase()) {
        case 'syrup':
            return '🧴';
        case 'injection':
            return '💉';
        case 'ointment':
            return '🧴';
        default:
            return '💊';
    }
}

// Initialize customer portal
document.addEventListener('DOMContentLoaded', async function() {
    updateCartCount();
    
    // Load products from database first
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
});

function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featuredProducts');
    const featuredProducts = products.slice(0, 4); // Show first 4 as featured
    
    featuredContainer.innerHTML = featuredProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.image ? `<img src="${product.image}" alt="${product.name}" class="medicine-thumbnail">` 
                               : `<div class="placeholder-image">${getCategoryIcon(product.category)}</div>`}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${getCategoryName(product.category)}</p>
                <p class="product-price">₹${product.price.toFixed(2)}</p>
                <div class="stock-status ${product.quantity > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="addToCart('${product.id}')" ${product.quantity <= 0 ? 'disabled' : ''}>
                        ${product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button class="btn btn-outline" onclick="viewProduct('${product.id}')">View Details</button>
                </div>
            </div>
        </div>
    `).join('');

    // Center single featured product visually
    if (featuredProducts.length === 1) {
        featuredContainer.classList.add('centered-single');
    } else {
        featuredContainer.classList.remove('centered-single');
    }
}

function loadAllProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="no-products">No medicines available at the moment</div>';
        return;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-category="${product.category}">
            <div class="product-image">
                ${product.image ? `<img src="${product.image}" alt="${product.name}" class="medicine-thumbnail">` 
                               : `<div class="placeholder-image">${getCategoryIcon(product.category)}</div>`}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${getCategoryName(product.category)}</p>
                <p class="product-price">₹${product.price.toFixed(2)}</p>
                <div class="stock-status ${product.quantity > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="addToCart('${product.id}')" ${product.quantity <= 0 ? 'disabled' : ''}>
                        ${product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button class="btn btn-outline" onclick="viewProduct('${product.id}')">View Details</button>
                </div>
            </div>
        </div>
    `).join('');

    // If only one product, center it so it doesn't take entire page width
    if (products.length === 1) {
        productsGrid.classList.add('centered-single');
    } else {
        productsGrid.classList.remove('centered-single');
    }
}

function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
}

function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent.toLowerCase();
        const productCategory = card.getAttribute('data-category');
        
        const matchesSearch = productName.includes(searchTerm);
        const matchesCategory = !category || productCategory === category;
        
        card.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
    });
}

function getCategoryName(category) {
    const categories = {
        'tablet': 'Tablets',
        'syrup': 'Syrup',
        'injection': 'Injection',
        'ointment': 'Ointment'
    };
    return categories[category] || category;
}

function viewProduct(productId) {
    // Store the product ID to view details
    localStorage.setItem('viewingProduct', productId);
    window.location.href = 'product-detail.html';
}

function loadProductDetail() {
    const productId = localStorage.getItem('viewingProduct');
    const product = products.find(p => p.id === productId);
    
    if (product) {
        document.getElementById('productDetail').innerHTML = `
            <div class="product-detail">
                <div class="product-image-large">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" class="medicine-image">` 
                                  : `<div class="placeholder-image-large">${getCategoryIcon(product.category)}</div>`}
                </div>
                <div class="product-info-detail">
                    <h1>${product.name}</h1>
                    <p class="product-category">${getCategoryName(product.category)}</p>
                    <p class="product-description">${product.description || 'No description available.'}</p>
                    <p class="product-dosage"><strong>Dosage:</strong> ${product.dosage || 'As prescribed by doctor.'}</p>
                    <p class="product-price">₹${product.price.toFixed(2)}</p>
                    <div class="stock-status ${product.quantity > 0 ? 'in-stock' : 'out-of-stock'}">
                        ${product.quantity > 0 ? `${product.quantity} units in stock` : 'Out of Stock'}
                    </div>
                    ${product.quantity > 0 ? `
                        <div class="quantity-selector">
                            <label for="quantity">Quantity:</label>
                            <input type="number" id="quantity" name="quantity" value="1" min="1" max="${product.quantity}">
                        </div>
                        <div class="product-actions">
                            <button class="btn btn-primary" onclick="addToCart('${product.id}', parseInt(document.getElementById('quantity').value))">Add to Cart</button>
                            <button class="btn btn-outline" onclick="window.history.back()">Continue Shopping</button>
                        </div>
                    ` : `
                        <div class="product-actions">
                            <button class="btn btn-primary" disabled>Out of Stock</button>
                            <button class="btn btn-outline" onclick="window.history.back()">Continue Shopping</button>
                        </div>
                    `}
                </div>
            </div>
        `;
    } else {
        document.getElementById('productDetail').innerHTML = `
            <div class="error-message">
                <h2>Product Not Found</h2>
                <p>The requested product could not be found.</p>
                <button class="btn btn-outline" onclick="window.history.back()">Go Back</button>
            </div>
        `;
    }
}

// Cart functionality is in cart.js