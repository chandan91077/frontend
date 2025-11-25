// Fixed Admin API Service
const adminApi = {
    // Check if user is admin and authenticated
    async checkAdminAuth() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Medicine management
    async getMedicines() {
        await this.checkAdminAuth();
        return await apiService.getMedicines();
    },

    async addMedicine(medicineData) {
    await this.checkAdminAuth();

    console.log('🔍 admin-api.js - Received medicineData:', medicineData);

    const dataToSend = {
        name: medicineData.name,
        batchNo: medicineData.batchNumber,            // ✔ backend requires batchNo
        totalQty: medicineData.totalQty || medicineData.quantity,  // ✔ FIXED fallback
        price: medicineData.price,
        expiryDate: medicineData.expiryDate,
        category: medicineData.category,
        soldQty: medicineData.soldQty || 0
    };

    if (medicineData.description) dataToSend.description = medicineData.description;
    if (medicineData.dosage) dataToSend.dosage = medicineData.dosage;
    if (medicineData.image) dataToSend.image = medicineData.image;

    console.log('🔍 admin-api.js - Sending to apiService:', dataToSend);
    return await apiService.addMedicine(dataToSend);
    },

    async updateMedicine(id, medicineData) {
    await this.checkAdminAuth();

    const dataToSend = {
        name: medicineData.name,
        batchNo: medicineData.batchNumber,            // ✔ FIXED
        totalQty: medicineData.totalQty || medicineData.quantity,  // ✔ FIXED fallback
        price: medicineData.price,
        expiryDate: medicineData.expiryDate,
        category: medicineData.category
    };

    if (medicineData.description) dataToSend.description = medicineData.description;
    if (medicineData.dosage) dataToSend.dosage = medicineData.dosage;
    if (medicineData.image) dataToSend.image = medicineData.image;

    return await apiService.updateMedicine(id, dataToSend);
    },

    async deleteMedicine(id) {
        await this.checkAdminAuth();
        return await apiService.deleteMedicine(id);
    },

    // Order management
    async getOrders() {
        await this.checkAdminAuth();
        return await apiService.getOrders();
    },

    async updateOrderStatus(orderId, status) {
        await this.checkAdminAuth();
        return await apiService.updateOrderStatus(orderId, status);
    },

    // Dashboard data
    async getDashboardStats() {
        await this.checkAdminAuth();
        return await apiService.getDashboardStats();
    }
};

// Make adminApi globally available
window.adminApi = adminApi;

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
    if (document.getElementById('medicinesList')) {
        await loadMedicinesFromDB();
    }

    if (document.getElementById('ordersList')) {
        await loadOrdersFromDB(); // ✅ added below
        if (typeof setupOrderFilters === 'function') setupOrderFilters();
    }

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
    if (!medicinesList) return;

    medicinesList.innerHTML = '';

    medicines.forEach(medicine => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${medicine.name}</td>
            <td>${medicine.batchNumber || medicine.batchNo || 'N/A'}</td>
            <td>${medicine.quantity || ((medicine.totalQty || 0) - (medicine.soldQty || 0))}</td>
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
        await adminApi.addMedicine(medicineData);
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

        document.getElementById('medicineName').value = medicine.name;
        document.getElementById('batchNumber').value = medicine.batchNumber || medicine.batchNo || '';
        document.getElementById('quantity').value = medicine.quantity || ((medicine.totalQty || 0) - (medicine.soldQty || 0));
        document.getElementById('price').value = medicine.price;
        document.getElementById('expiryDate').value = medicine.expiryDate.split('T')[0];
        document.getElementById('category').value = medicine.category;
        document.getElementById('description').value = medicine.description || '';
        document.getElementById('dosage').value = medicine.dosage || '';

        showAddMedicineForm();

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
        await adminApi.updateMedicine(medicineId, medicineData);
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
            await adminApi.deleteMedicine(medicineId);
            await loadMedicinesFromDB();
            alert('Medicine deleted successfully!');
        } catch (error) {
            alert('Failed to delete medicine: ' + error.message);
        }
    }
}

/* ------------------------------
   ✅ Added Orders Loader + Status Updater
--------------------------------*/

async function loadOrdersFromDB() {
    try {
        console.log('📦 Loading orders from backend...');

        const response = await adminApi.getOrders();
        let orders = [];

        if (Array.isArray(response)) orders = response;
        else if (response?.orders) orders = response.orders;
        else if (response?.data) orders = response.data;

        console.log('✅ Orders loaded:', orders.length);

        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        ordersList.innerHTML = '';

        if (orders.length === 0) {
            ordersList.innerHTML = `<tr><td colspan="6" style="text-align:center;">No orders found</td></tr>`;
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderId || order._id || '—'}</td>
                <td>${order.customer?.name || order.customerName || 'Unknown'}</td>
                <td>₹${order.totalAmount || order.total || 0}</td>
                <td class="order-status-cell ${getStatusColorClass(order.orderStatus || order.status)}">
                ${order.orderStatus || order.status || 'Pending'}
                </td>

                <td>${new Date(order.createdAt || order.date || Date.now()).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="handleUpdateOrderStatus('${order.orderId || order._id}')">Update Status</button>
                </td>
            `;
            ordersList.appendChild(row);
        });

        updateSalesStats(orders);
    } catch (error) {
        console.error('❌ Failed to load orders:', error);
        const ordersList = document.getElementById('ordersList');
        if (ordersList) {
            ordersList.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Error loading orders</td></tr>`;
        }
    }
}

function updateSalesStats(orders) {
    const totalSalesElem = document.getElementById('totalSalesCard') || document.querySelectorAll('.stat-number')[0];
    const ordersTodayElem = document.getElementById('ordersCard') || document.querySelectorAll('.stat-number')[1];
    const pendingOrdersElem = document.getElementById('pendingOrdersCard') || document.querySelectorAll('.stat-number')[2];

    if (!totalSalesElem || !ordersTodayElem || !pendingOrdersElem) return;

    const totalSales = orders.reduce((sum, o) => sum + (parseFloat(o.totalAmount || o.total || 0)), 0);
    const today = new Date().toISOString().split('T')[0];
    const ordersToday = orders.filter(o => (o.createdAt || '').startsWith(today)).length;
    const pendingOrders = orders.filter(o => (o.orderStatus || o.status || '').toLowerCase() === 'pending').length;

    totalSalesElem.textContent = `₹${totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    ordersTodayElem.textContent = ordersToday;
    pendingOrdersElem.textContent = pendingOrders;
}

/* ------------------------------
   ✅ Improved Status Update with Dropdown
--------------------------------*/
async function handleUpdateOrderStatus(orderId) {
    const row = document.querySelector(`button[onclick="handleUpdateOrderStatus('${orderId}')"]`)?.closest('tr');
    if (!row) return;

    // Create dropdown if not already present
    let existingSelect = row.querySelector('.status-dropdown');
    if (existingSelect) return; // already open

    const select = document.createElement('select');
    select.className = 'status-dropdown';
    select.style.padding = '6px';
    select.style.borderRadius = '6px';
    select.style.border = '1px solid #ccc';
    select.style.marginLeft = '5px';
    select.innerHTML = `
        <option value="">--Select--</option>
        <option value="Confirmed">Confirmed</option>
        <option value="Shipped">Shipped</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
    `;

    // Replace Update button temporarily
    const updateBtn = row.querySelector('button.btn-primary');
    updateBtn.style.display = 'none';
    updateBtn.insertAdjacentElement('afterend', select);

    select.addEventListener('change', async () => {
        const newStatus = select.value;
        if (!newStatus) return;

        try {
            // Call API to update order status
            await adminApi.updateOrderStatus(orderId, newStatus);
            alert(`Order status updated to ${newStatus}!`);
            await loadOrdersFromDB(); // refresh the table
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status.');
        }
    });
}
// 🎨 Assigns color classes to order statuses
function getStatusColorClass(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('deliver')) return 'status-delivered';   // Green
    if (s.includes('cancel')) return 'status-cancelled';    // Red
    if (s.includes('ship') || s.includes('confirm')) return 'status-shipped'; // Blue
    if (s.includes('pend') || s.includes('process')) return 'status-pending'; // Orange
    return '';
}
/* =============================
   ✅ Date / Month Filter System
   ============================= */
document.getElementById('applyDateFilterBtn')?.addEventListener('click', () => {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    if (!start || !end) {
        alert('Please select both start and end dates!');
        return;
    }
    applyFilterByDate(start, end);
});

document.getElementById('applyMonthFilterBtn')?.addEventListener('click', () => {
    const monthValue = document.getElementById('monthPicker').value;
    if (!monthValue) {
        alert('Please select a month!');
        return;
    }
    applyFilterByMonth(monthValue);
});

async function applyFilterByDate(startDate, endDate) {
    const orders = await adminApi.getOrders();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filtered = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.date);
        return orderDate >= start && orderDate <= end;
    });

    displayFilteredOrders(filtered, `Filtered orders from ${startDate} to ${endDate}`);
}

async function applyFilterByMonth(monthValue) {
    const orders = await adminApi.getOrders();
    const [year, month] = monthValue.split('-').map(Number);
    const filtered = orders.filter(order => {
        const date = new Date(order.createdAt || order.date);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
    });

    displayFilteredOrders(filtered, `Filtered orders for ${monthValue}`);
}

function displayFilteredOrders(filteredOrders, title) {
    const ordersList = document.getElementById('ordersList');
    const filterSummary = document.getElementById('filterSummary');
    if (!ordersList || !filterSummary) return;

    ordersList.innerHTML = '';
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `<tr><td colspan="6" style="text-align:center;">No orders found</td></tr>`;
        filterSummary.style.display = 'none';
        return;
    }

    let totalSales = 0;
    let pendingCount = 0;

    filteredOrders.forEach(order => {
        const status = order.orderStatus || order.status || 'Pending';
        const color = status === 'Delivered' ? 'green' : status === 'Cancelled' ? 'red' : 'orange';
        totalSales += parseFloat(order.totalAmount || order.total || 0);
        if (status.toLowerCase() === 'pending') pendingCount++;

        ordersList.innerHTML += `
            <tr>
                <td>${order.orderId || order._id}</td>
                <td>${order.customer?.name || order.customerName || 'Unknown'}</td>
                <td>₹${order.totalAmount || order.total}</td>
                <td style="color:${color};font-weight:600;">${status}</td>
                <td>${new Date(order.createdAt || order.date).toLocaleDateString()}</td>
                <td><button class="btn btn-primary btn-sm" onclick="handleUpdateOrderStatus('${order._id || order.orderId}')">Update Status</button></td>
            </tr>
        `;
    });

    filterSummary.innerHTML = `
        <div style="margin-top:10px; font-size:16px;">
            <p>📅 <b>${title}</b></p>
            <p>💰 Total Sales: ₹${totalSales.toLocaleString()}</p>
            <p>⏳ Pending Orders: ${pendingCount}</p>
        </div>
    `;
    filterSummary.style.display = 'block';

    // 🆕 Update the stat cards with filtered data
    updateStatCards(totalSales, pendingCount, filteredOrders.length);
}

// 🆕 Function to update stat cards with filtered data
function updateStatCards(totalSales, pendingCount, totalOrders) {
    const totalSalesCard = document.getElementById('totalSalesCard');
    const ordersCard = document.getElementById('ordersCard');
    const pendingOrdersCard = document.getElementById('pendingOrdersCard');

    if (totalSalesCard) {
        totalSalesCard.textContent = `₹${totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    if (ordersCard) {
        ordersCard.textContent = totalOrders;
    }
    if (pendingOrdersCard) {
        pendingOrdersCard.textContent = pendingCount;
    }
}
/* =============================
   ✅ Clear Filters Feature
   ============================= */
document.getElementById('clearFiltersBtn')?.addEventListener('click', async () => {
    try {
        // Clear date & month inputs
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('monthPicker').value = '';

        // Hide summary box
        const summary = document.getElementById('filterSummary');
        if (summary) summary.style.display = 'none';

        // Reload all orders from backend
        await loadOrdersFromDB();
        alert('Filters cleared successfully!');
    } catch (error) {
        console.error('❌ Error clearing filters:', error);
    }
});


