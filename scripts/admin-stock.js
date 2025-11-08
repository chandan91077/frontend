// Stock Management Functions
function showUpdateStockModal(medicineId, medicineName, currentQuantity) {
    const modal = document.getElementById('updateStockModal');
    const medicineIdInput = document.getElementById('updateMedicineId');
    const currentStockSpan = document.getElementById('currentStock');
    const addStockInput = document.getElementById('addStock');

    medicineIdInput.value = medicineId;
    currentStockSpan.textContent = currentQuantity;
    addStockInput.value = '';
    
    modal.style.display = 'block';
}

function hideUpdateStockModal() {
    const modal = document.getElementById('updateStockModal');
    modal.style.display = 'none';
}

// Add event listener for the update stock form
document.getElementById('updateStockForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const medicineId = document.getElementById('updateMedicineId').value;
    const addStock = parseInt(document.getElementById('addStock').value);
    
    try {
       const response = await fetch(`${apiService.baseUrl}/medicines/${medicineId}/updateStock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...apiService.getAuthHeaders()
            },
            body: JSON.stringify({ addQuantity: addStock })
        });

        if (!response.ok) {
            throw new Error('Failed to update stock');
        }

        const result = await response.json();
        
        // Update the UI
        await initializeMedicines();
        
        // Hide the modal
        hideUpdateStockModal();
        
        // Show success message
        alert('Stock updated successfully');
    } catch (error) {
        console.error('Error updating stock:', error);
        alert('Failed to update stock. Please try again.');
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('updateStockModal');
    if (event.target === modal) {
        hideUpdateStockModal();
    }
}
