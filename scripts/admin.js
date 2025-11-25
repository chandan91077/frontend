
// Admin JavaScript functionality

document.addEventListener('DOMContentLoaded', async function() {
    // Prefer admin-api's authentication check if available
    if (typeof checkAdminAuth === 'function') {
        await checkAdminAuth();
    } else {
        // Fallback simple guard for legacy pages
        if (window.location.pathname.includes('/admin/') && !window.location.pathname.includes('login.html')) {
            const isLoggedIn = localStorage.getItem('adminLoggedIn');
            if (!isLoggedIn) {
                window.location.href = 'login.html';
                return;
            }
        }
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUsername');
            // If admin-api provides logout, call it
            if (typeof apiService !== 'undefined') {
                // clear token stored by apiService
                localStorage.removeItem('authToken');
            }
            window.location.href = 'login.html';
        });
    }

    // Initialize medicines list: prefer admin-api loader if present
    if (document.getElementById('medicinesList')) {
        if (typeof loadMedicinesFromDB === 'function') {
            await loadMedicinesFromDB();
        } else {
            initializeMedicines();
        }
    }

    // Initialize orders list: prefer admin-api loader if present
    if (document.getElementById('ordersList')) {
        if (typeof loadOrdersFromDB === 'function') {
            await loadOrdersFromDB();
        } else {
            initializeOrders();
        }
    }
});

// Medicine Management
let medicines = [];

async function initializeMedicines() {
    try {
        medicines = await adminApi.getMedicines();
        
        const medicinesList = document.getElementById('medicinesList');
        if (!medicinesList) return;
        
        medicinesList.innerHTML = '';
        
        medicines.forEach(med => {
            const row = document.createElement('tr');
            // Calculate Available Qty
            const availableQty = (med.totalQty || 0) - (med.soldQty || 0);
            let statusClass = 'text-red-600';
            if (availableQty > 10) statusClass = 'text-green-600';
            else if (availableQty > 0) statusClass = 'text-yellow-600';
            let stockStatus = 'Out of Stock';
            if (availableQty > 10) stockStatus = 'In Stock';
            else if (availableQty > 0) stockStatus = 'Low Stock';

            const imageUrl = window.resolveMedicineImage ? window.resolveMedicineImage(med) : null;
            const imgSrc = imageUrl || (window.createFallbackImage ? window.createFallbackImage() : '');
            row.innerHTML = `
              <td class="px-4 py-3 text-center">
                <img 
                  src="${imgSrc}" 
                  alt="${med.name}" 
                  class="w-10 h-10 rounded mx-auto"
                  onerror="if(window.handleImageError) window.handleImageError(this, '${med.category || 'medicine'}');"
                />
              </td>
              <td class="px-4 py-3 text-center">${med.name}</td>
              <td class="px-4 py-3 text-center">${med.batchNo}</td>
              <td class="px-4 py-3 text-center">${med.category}</td>
              <td class="px-4 py-3 text-center">₹${med.price}</td>
              <td class="px-4 py-3 text-center font-semibold ${statusClass}">${stockStatus}</td>
              <td class="px-4 py-3 text-center font-bold">${availableQty}</td>
              <td class="px-4 py-3 text-center">${med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-IN') : '-'}</td>
              <td class="px-4 py-3 text-center space-x-2">
                <button onclick="editMedicine('${med._id}')" class="bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 transition">Edit</button>
                <button onclick="deleteMedicine('${med._id}')" class="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500 transition">Delete</button>
              </td>
            `;
            medicinesList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading medicines:', error);
        alert('Failed to load medicines. Please try again.');
    }
}

function showAddMedicineForm() {
    document.getElementById('addMedicineForm').style.display = 'block';
}

function hideAddMedicineForm() {
    document.getElementById('addMedicineForm').style.display = 'none';
    document.getElementById('medicineForm').reset();
}

const medicineForm = document.getElementById('medicineForm');
if (medicineForm) {
    medicineForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this);
            const medicineData = {
                name: formData.get('medicineName'),
                batchNumber: formData.get('batchNumber'),
                totalQty: parseInt(formData.get('quantity')),
                price: parseFloat(formData.get('price')),
                expiryDate: formData.get('expiryDate'),
                category: formData.get('category')
            };
            
            await adminApi.addMedicine(medicineData);
            await initializeMedicines();
            hideAddMedicineForm();
            alert('Medicine added successfully!');
        } catch (error) {
            console.error('Error adding medicine:', error);
            alert('Failed to add medicine. Please try again.');
        }
    });
}

async function editMedicine(id) {
    const medicine = medicines.find(m => m._id === id);
    if (medicine) {
        try {
            // Populate form with medicine data
            document.getElementById('medicineName').value = medicine.name;
            document.getElementById('batchNumber').value = medicine.batchNumber;
            document.getElementById('quantity').value = medicine.quantity;
            document.getElementById('price').value = medicine.price;
            document.getElementById('expiryDate').value = new Date(medicine.expiryDate).toISOString().split('T')[0];
            document.getElementById('category').value = medicine.category;
            
            // Store the medicine ID for update
            medicineForm.dataset.editId = medicine._id;
            
            showAddMedicineForm();
        } catch (error) {
            console.error('Error editing medicine:', error);
            alert('Failed to load medicine details. Please try again.');
        }
    }
}

async function deleteMedicine(id) {
    if (confirm('Are you sure you want to delete this medicine?')) {
        try {
            await adminApi.deleteMedicine(id);
            await initializeMedicines();
            alert('Medicine deleted successfully!');
        } catch (error) {
            console.error('Error deleting medicine:', error);
            alert('Failed to delete medicine. Please try again.');
        }
    }
}

// Orders Management
// Only use the legacy in-file orders fallback if the admin-api loader isn't present.
if (typeof loadOrdersFromDB !== 'function') {
    let orders = JSON.parse(localStorage.getItem('orders')) || [
    {
        id: 'ORD001',
        customer: 'John Doe',
        amount: 1250.00,
        status: 'Delivered',
        date: '2024-01-15'
    },
    {
        id: 'ORD002',
        customer: 'Jane Smith',
        amount: 890.50,
        status: 'Processing',
        date: '2024-01-16'
    },
    {
        id: 'ORD003',
        customer: 'Mike Johnson',
        amount: 1567.25,
        status: 'Shipped',
        date: '2024-01-16'
    }
];

function initializeOrders() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>₹${order.amount}</td>
            <td><span class="status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td>${order.date}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="updateOrderStatus('${order.id}')">Update Status</button>
            </td>
        `;
        ordersList.appendChild(row);
    });
}

function updateOrderStatus(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        const newStatus = prompt('Enter new status (Processing/Shipped/Delivered):', order.status);
        if (newStatus && ['Processing', 'Shipped', 'Delivered'].includes(newStatus)) {
            order.status = newStatus;
            localStorage.setItem('orders', JSON.stringify(orders));
            initializeOrders();
            alert('Order status updated successfully!');
        }
    }
}
}
