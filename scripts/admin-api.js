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
        
        // 🔍 DEBUG: Log what admin-api receives
        console.log('🔍 admin-api.js - Received medicineData:', medicineData);
        
        // ✅ CORRECT: Pass data directly without field name conversion
        const dataToSend = {
            name: medicineData.name,
            batchNumber: medicineData.batchNumber, // ✅ Keep as batchNumber
            totalQty: medicineData.quantity || medicineData.totalQty,
            price: medicineData.price,
            expiryDate: medicineData.expiryDate,
            category: medicineData.category,
            soldQty: medicineData.soldQty || 0
        };

        // Add optional fields if present
        if (medicineData.description) {
            dataToSend.description = medicineData.description;
        }
        if (medicineData.dosage) {
            dataToSend.dosage = medicineData.dosage;
        }
        if (medicineData.image) {
            dataToSend.image = medicineData.image;
        }

        console.log('🔍 admin-api.js - Sending to apiService:', dataToSend);
        return await apiService.addMedicine(dataToSend);
    },

    async updateMedicine(id, medicineData) {
        await this.checkAdminAuth();
        
        // ✅ CORRECT: Pass data directly without field name conversion
        const dataToSend = {
            name: medicineData.name,
            batchNumber: medicineData.batchNumber, // ✅ Keep as batchNumber
            totalQty: medicineData.quantity || medicineData.totalQty,
            price: medicineData.price,
            expiryDate: medicineData.expiryDate,
            category: medicineData.category
        };

        // Add optional fields if present
        if (medicineData.description) {
            dataToSend.description = medicineData.description;
        }
        if (medicineData.dosage) {
            dataToSend.dosage = medicineData.dosage;
        }
        if (medicineData.image) {
            dataToSend.image = medicineData.image;
        }

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
        // Use the fixed adminApi.addMedicine method
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
        
        // Populate form with medicine data
        document.getElementById('medicineName').value = medicine.name;
        document.getElementById('batchNumber').value = medicine.batchNumber || medicine.batchNo || '';
        document.getElementById('quantity').value = medicine.quantity || ((medicine.totalQty || 0) - (medicine.soldQty || 0));
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

// ... rest of your existing code (orders, dashboard stats, etc.) remains the same
