
// ✅ CORRECT - Use direct URL
const API_BASE_URL = 'https://bakend-88v1.onrender.com';

// Will store products loaded from database
let products = [];

// ✅ Load products from database using BASE URL
async function loadProductsFromDB() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/medicines`);
        if (!response.ok) {
            throw new Error('Failed to fetch medicines');
        }

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
        case 'syrup': return '🧴';
        case 'injection': return '💉';
        case 'ointment': return '🧴';
        default: return '💊';
    }
}

// ✅ Initialize customer portal
document.addEventListener('DOMContentLoaded', async function () {
    updateCartCount();
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
});

// ✅ Featured Products
function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featuredProducts');
    const featuredProducts = products.slice(0, 4);

    featuredContainer.innerHTML = featuredProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.image
                    ? `<img src="${product.image}" alt="${product.name}" class="medicine-thumbnail" onerror="window.handleImageError(this, '${product.category}')">`
                    : `<img src="${window.createFallbackImage()}" alt="${product.name}" class="medicine-thumbnail">`
                }
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
}

// ✅ Load All Products
function loadAllProducts() {
    const productsGrid = document.getElementById('productsGrid');

    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="no-products">No medicines available at the moment</div>';
        return;
    }

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-category="${product.category}">
            <div class="product-image">
                ${product.image
                    ? `<img src="${product.image}" alt="${product.name}" class="medicine-thumbnail" onerror="window.handleImageError(this, '${product.category}')">`
                    : `<img src="${window.createFallbackImage()}" alt="${product.name}" class="medicine-thumbnail">`
                }
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
}

function setupSearchFilter() {
    document.getElementById('searchInput').addEventListener('input', filterProducts);
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
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
        tablet: 'Tablets',
        syrup: 'Syrup',
        injection: 'Injection',
        ointment: 'Ointment',
        soap: 'Soap',
        capsule: 'Capsule',
        oil: 'Oil',
        gel: 'Gel'
    };
    return categories[category] || category;
}

function viewProduct(productId) {
    localStorage.setItem('viewingProduct', productId);
    window.location.href = 'product-detail.html';
}

// ✅ Load Product Detail
function loadProductDetail() {
    const productId = localStorage.getItem('viewingProduct');
    const product = products.find(p => p.id === productId);

    if (!product) {
        document.getElementById('productDetail').innerHTML = `
            <div class="error-message">
                <h2>Product Not Found</h2>
                <button class="btn btn-outline" onclick="window.history.back()">Go Back</button>
            </div>`;
        return;
    }

    document.getElementById('productDetail').innerHTML = `
        <div class="product-detail">
            <div class="product-image-large">
                ${product.image
                    ? `<img src="${product.image}" alt="${product.name}" class="medicine-image" onerror="window.handleImageError(this, '${product.category}')">`
                    : `<img src="${window.createFallbackImage()}" alt="${product.name}" class="medicine-image">`
                }
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
                        <input type="number" id="quantity" value="1" min="1" max="${product.quantity}">
                    </div>
                    <button class="btn btn-primary" onclick="addToCart('${product.id}', parseInt(document.getElementById('quantity').value))">
                        Add to Cart
                    </button>
                ` : `
                    <button class="btn btn-primary" disabled>Out of Stock</button>
                `}

                <button class="btn btn-outline" onclick="window.history.back()">Continue Shopping</button>
            </div>
        </div>
    `;
}
