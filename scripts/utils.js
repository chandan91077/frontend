function resolveMedicineImage(medicine) {
    const possibleFields = [
        medicine.image,
        medicine.imageUrl,
        medicine.image?.url,
        medicine.images?.[0],
        medicine.imageURL
    ];
    
    for (const field of possibleFields) {
        if (field && typeof field === 'string' && field.trim() !== '') {
            return field;
        }
    }
    
    const category = medicine.category || medicine.categoryName || 'Medicine';
    return `https://placehold.co/150x150?text=${encodeURIComponent(category)}`;
}

function getCategoryIcon(category) {
    if (!category) return '💊';
    switch (category.toLowerCase()) {
        case 'syrup': return '🧴';
        case 'injection': return '💉';
        case 'ointment': return '🧴';
        default: return '💊';
    }
}

window.resolveMedicineImage = resolveMedicineImage;
window.getCategoryIcon = getCategoryIcon;
