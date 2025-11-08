// Updated admin functionality with MongoDB integration

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initializeAdminDashboard();
});

async function checkAdminAuth() {
    const token = localStorage.getItem('authToken');
    if (!token && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    // Verify token is valid
    if (token) {
        try {
            await apiService.getDashboardStats();
        } catch (error) {
            localStorage.removeItem('authToken');
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    }
}

async function initializeAdminDashboard() {
    // Load medicines if on dashboard
    if (document.getElementById('medicinesList')) {
        await loadMedicinesFromDB();
    }

    // Load orders if on sales page
    if (document.getElementById('ordersList')) {
        await loadOrdersFromDB();
        // wire up filters if present
        setupOrderFilters();
    }

    // Load dashboard stats if on dashboard
    if (document.querySelector('.sales-stats')) {
        await loadDashboardStats();
    }
}

async function loadMedicinesFromDB() {
    try {
        const response = await apiService.getMedicines();
        displayMedicines(response);
    } catch (error) {
        console.error('Failed to load medicines:', error);
        alert('Failed to load medicines. Please try again.');
    }
}

function displayMedicines(medicines) {
    const medicinesList = document.getElementById('medicinesList');
    medicinesList.innerHTML = '';

    medicines.forEach(medicine => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${medicine.name}</td>
            <td>${medicine.batchNumber}</td>
            <td>${medicine.quantity}</td>
            <td>₹${medicine.price}</td>
            <td>${new Date(medicine.expiryDate).toLocaleDateString()}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="editMedicine('${medicine._id}')">Edit</button>
                <button class="btn btn-sm btn-secondary" onclick="deleteMedicine('${medicine._id}')">Delete</button>
            </td>
        `;
        medicinesList.appendChild(row);
    });
}

async function addMedicineToDB(medicineData) {
    try {
        await apiService.addMedicine(medicineData);
        await loadMedicinesFromDB();
        hideAddMedicineForm();
        alert('Medicine added successfully!');
    } catch (error) {
        alert('Failed to add medicine: ' + error.message);
    }
}

async function editMedicine(medicineId) {
    try {
        const medicine = await apiService.getMedicine(medicineId);
        
        // Populate form with medicine data
        document.getElementById('medicineName').value = medicine.name;
        document.getElementById('batchNumber').value = medicine.batchNumber;
        document.getElementById('quantity').value = medicine.quantity;
        document.getElementById('price').value = medicine.price;
        document.getElementById('expiryDate').value = medicine.expiryDate.split('T')[0];
        document.getElementById('category').value = medicine.category;
        document.getElementById('description').value = medicine.description || '';
        document.getElementById('dosage').value = medicine.dosage || '';

        showAddMedicineForm();
        
        // Set form to update mode
        const form = document.getElementById('medicineForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await updateMedicineInDB(medicineId);
        };
    } catch (error) {
        alert('Failed to load medicine: ' + error.message);
    }
}

async function updateMedicineInDB(medicineId) {
    const formData = new FormData(document.getElementById('medicineForm'));
    
    const medicineData = {
        name: formData.get('medicineName'),
        batchNumber: formData.get('batchNumber'),
        quantity: parseInt(formData.get('quantity')),
        price: parseFloat(formData.get('price')),
        expiryDate: formData.get('expiryDate'),
        category: formData.get('category'),
        description: formData.get('description'),
        dosage: formData.get('dosage')
    };

    try {
        await apiService.updateMedicine(medicineId, medicineData);
        await loadMedicinesFromDB();
        hideAddMedicineForm();
        alert('Medicine updated successfully!');
    } catch (error) {
        alert('Failed to update medicine: ' + error.message);
    }
}

async function deleteMedicine(medicineId) {
    if (confirm('Are you sure you want to delete this medicine?')) {
        try {
            await apiService.deleteMedicine(medicineId);
            await loadMedicinesFromDB();
            alert('Medicine deleted successfully!');
        } catch (error) {
            alert('Failed to delete medicine: ' + error.message);
        }
    }
}

async function loadOrdersFromDB() {
    try {
        const response = await apiService.getOrders();
        // store fetched orders for client-side filtering
        window.__admin_lastFetchedOrders = response || [];
        displayOrders(response);
    } catch (error) {
        console.error('Failed to load orders:', error);
        alert('Failed to load orders. Please try again.');
    }
}

// Set up client-side order filters (date range and month)
function setupOrderFilters() {
    const applyDateBtn = document.getElementById('applyDateFilterBtn');
    const applyMonthBtn = document.getElementById('applyMonthFilterBtn');
    const clearBtn = document.getElementById('clearFiltersBtn');

    applyDateBtn?.addEventListener('click', () => {
        const startVal = document.getElementById('startDate')?.value;
        const endVal = document.getElementById('endDate')?.value;
        if (!startVal || !endVal) {
            alert('Please select both start and end dates.');
            return;
        }
        const start = new Date(startVal);
        start.setHours(0,0,0,0);
        const end = new Date(endVal);
        end.setHours(23,59,59,999);

        const filtered = (window.__admin_lastFetchedOrders || []).filter(o => {
            const d = new Date(o.createdAt);
            return d >= start && d <= end;
        });
        displayOrders(filtered);
    });

    applyMonthBtn?.addEventListener('click', () => {
        const monthVal = document.getElementById('monthPicker')?.value; // format YYYY-MM
        if (!monthVal) {
            alert('Please select a month.');
            return;
        }
        const [y, m] = monthVal.split('-').map(Number);
        const filtered = (window.__admin_lastFetchedOrders || []).filter(o => {
            const d = new Date(o.createdAt);
            return d.getFullYear() === y && (d.getMonth() + 1) === m;
        });
        displayOrders(filtered);
    });

    clearBtn?.addEventListener('click', () => {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('monthPicker').value = '';
        displayOrders(window.__admin_lastFetchedOrders || []);
    });
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.customer?.name || 'N/A'}</td>
            <td>₹${order.totalAmount}</td>
            <td><span class="status-${order.orderStatus.toLowerCase()}">${order.orderStatus}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="updateOrderStatus('${order.orderId}')">Update Status</button>
            </td>
        `;
        ordersList.appendChild(row);
    });
}

function displayDashboardStats(stats) {
    const container = document.querySelector('.sales-stats');
    if (!container) return;
    // Render three cards: Total Sales, Orders Today, Pending Orders
    container.innerHTML = `
        <div class="stat-card">
            <h3>Total Sales</h3>
            <p class="stat-number">₹${Number(stats.totalSales ?? 0).toLocaleString()}</p>
        </div>
        <div class="stat-card">
            <h3>Orders Today</h3>
            <p class="stat-number">${stats.ordersToday ?? 0}</p>
        </div>
        <div class="stat-card">
            <h3>Pending Orders</h3>
            <p class="stat-number">${stats.pendingOrders ?? 0}</p>
        </div>
    `;
}

// Fetch dashboard stats from backend and render
async function loadDashboardStats() {
    try {
        const stats = await apiService.getDashboardStats();
        // Ensure numeric conversion for totalSales
        stats.totalSales = Number(stats.totalSales || 0);
        displayDashboardStats(stats);
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

// Update the medicine form submission
document.getElementById('medicineForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const medicineData = {
        name: formData.get('medicineName'),
        batchNumber: formData.get('batchNumber'),
        quantity: parseInt(formData.get('quantity')),
        price: parseFloat(formData.get('price')),
        expiryDate: formData.get('expiryDate'),
        category: formData.get('category'),
        description: formData.get('description'),
        dosage: formData.get('dosage')
    };

    await addMedicineToDB(medicineData);
});
 

// Admin: show modal and update order status (safe implementation)
async function updateOrderStatus(orderId) {
    console.log('updateOrderStatus called for', orderId);
    try {
        let overlay = document.getElementById('statusModalOverlay');
        if (!overlay) {
            const modal = document.createElement('div');
            modal.id = 'statusModal';
            modal.innerHTML = `<div class="modal-overlay" id="statusModalOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.4);display:none;align-items:center;justify-content:center;z-index:2000;">` +
                `<div class="modal-card" role="dialog" aria-modal="true" style="background:#fff;padding:20px;border-radius:8px;max-width:400px;width:100%;box-shadow:0 10px 30px rgba(0,0,0,0.2);">` +
                    `<h3 style="margin-top:0;">Update Order Status</h3>` +
                    `<p style="margin:6px 0 12px;color:#444;">Select new status for <strong id="modalOrderId"></strong></p>` +
                    `<select id="statusSelect" style="width:100%;padding:10px;margin-bottom:12px;border:1px solid #ddd;border-radius:4px;">` +
                        `<option value="pending">Pending</option>` +
                        `<option value="confirmed">Confirmed</option>` +
                        `<option value="shipped">Shipped</option>` +
                        `<option value="delivered">Delivered</option>` +
                        `<option value="cancelled">Cancelled</option>` +
                    `</select>` +
                    `<div style="display:flex;gap:10px;justify-content:flex-end;">` +
                        `<button id="statusCancel" class="btn btn-secondary">Cancel</button>` +
                        `<button id="statusSave" class="btn btn-primary">Save</button>` +
                    `</div>` +
                `</div>` +
            `</div>`;
            document.body.appendChild(modal);
            overlay = document.getElementById('statusModalOverlay');
            const cancelBtn = document.getElementById('statusCancel');
            cancelBtn?.addEventListener('click', () => { overlay.style.display = 'none'; });
        }

        document.getElementById('modalOrderId').textContent = orderId;
        document.getElementById('statusSelect').value = 'pending';
        overlay.style.display = 'flex';

        const saveBtn = document.getElementById('statusSave');
        if (!saveBtn) throw new Error('Save button not found in status modal');

        const handler = async () => {
            const newStatus = document.getElementById('statusSelect').value;
            try {
                await apiService.updateOrderStatus(orderId, newStatus);
                await loadOrdersFromDB();
                overlay.style.display = 'none';
                alert('Order status updated successfully!');
            } catch (error) {
                console.error('Error updating order status:', error);
                alert('Failed to update order status: ' + (error.message || error));
            }
        };

        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', handler);

    } catch (err) {
        console.error('updateOrderStatus fallback due to error:', err);
        const newStatus = prompt('Enter new status (pending/confirmed/shipped/delivered/cancelled):');
        if (newStatus && ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
            try {
                await apiService.updateOrderStatus(orderId, newStatus);
                await loadOrdersFromDB();
                alert('Order status updated successfully!');
            } catch (error) {
                console.error('Fallback update failed:', error);
                alert('Failed to update order status: ' + (error.message || error));
            }
        }
    }
}