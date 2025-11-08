class ApiService {
    constructor() {
        this.baseUrl = 'https://bakend-88v1.onrender.com/api';
    }

    getHeaders() {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = this.getHeaders();
            
            // Ensure method is set for POST/PUT requests
            const config = {
                method: options.method || 'GET',
                headers: headers,
                ...options
            };
            
            // Only include body if it's a POST, PUT, or PATCH request
            if (config.method !== 'GET' && config.method !== 'HEAD' && options.body) {
                config.body = options.body;
            }
            
            const response = await fetch(url, config);

            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (err) {
                data = { raw: text, error: 'Invalid JSON response' };
            }

            if (!response.ok) {
                // Log full error for debugging
                console.error('API Request Failed:', {
                    url,
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
                
                // Create a detailed error message
                const errorMessage = data.error || data.message || response.statusText || 'Request failed';
                const apiError = new Error(errorMessage);
                apiError.status = response.status;
                apiError.data = data;
                throw apiError;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            // Re-throw with more context if it's a network error
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
            }
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    // Medicine endpoints
    async getMedicines() {
        return this.request('/medicines');
    }

    async getMedicine(id) {
        return this.request(`/medicines/${id}`);
    }

    async addMedicine(medicineData) {
        // 🔍 DEBUG: Log what's being received and sent
        console.log('🔍 api-service.js - Received medicineData:', medicineData);
        console.log('🔍 api-service.js - Batch number value:', medicineData.batchNumber);
        console.log('🔍 api-service.js - All fields received:', Object.keys(medicineData));
        
        // ✅ ONLY CHANGE: Convert batchNumber to batchNo
        const dataToSend = {
            name: medicineData.name,
            batchNo: medicineData.batchNumber, // ✅ ONLY CHANGE - convert to batchNo
            totalQty: medicineData.totalQty,
            price: medicineData.price,
            expiryDate: medicineData.expiryDate,
            category: medicineData.category,
            soldQty: medicineData.soldQty || 0
        };

        // Add image if present
        if (medicineData.image) {
            dataToSend.image = medicineData.image;
        }

        console.log('🔍 api-service.js - Final data being sent to backend:', dataToSend);
        
        return this.request('/medicines', {
            method: 'POST',
            body: JSON.stringify(dataToSend)
        });
    }

    async updateMedicine(id, medicineData) {
        // 🔍 DEBUG: Log update data
        console.log('🔍 api-service.js - Update medicine data:', medicineData);
        
        // ✅ NO CHANGES - keep original structure
        const dataToSend = {
            name: medicineData.name,
            batchNumber: medicineData.batchNumber, // ✅ NO CHANGE - keep as batchNumber
            totalQty: medicineData.totalQty,
            price: medicineData.price,
            expiryDate: medicineData.expiryDate,
            category: medicineData.category
        };

        // Add image if present
        if (medicineData.image) {
            dataToSend.image = medicineData.image;
        }

        return this.request(`/medicines/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dataToSend)
        });
    }

    async deleteMedicine(id) {
        return this.request(`/medicines/${id}`, {
            method: 'DELETE'
        });
    }

    // Order endpoints
    async getOrders() {
        return this.request('/orders');
    }

    async updateOrderStatus(orderId, status) {
        return this.request(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ orderStatus: status })
        });
    }

    // Dashboard endpoints
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }
}

// Create global instance
const apiService = new ApiService();
