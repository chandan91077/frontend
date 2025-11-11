function resolveMedicineImage(medicine) {
    const possibleFields = [
        medicine.image,
        medicine.imageUrl,
        medicine.image?.url,
        medicine.images?.[0],
        medicine.imageURL
    ];
    
    for (const field of possibleFields) {
        if (field && typeof field === 'string' && field.trim() !== '' && !field.includes('placeholder')) {
            return field;
        }
    }
    
    return null;
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

function createFallbackImage() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="#f0f0f0"/><circle cx="75" cy="65" r="30" fill="#ddd"/><rect x="45" y="95" width="60" height="8" rx="4" fill="#ddd"/><rect x="55" y="108" width="40" height="6" rx="3" fill="#ddd"/></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function handleImageError(imgElement, category) {
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect width="150" height="150" fill="#f0f0f0"/><circle cx="75" cy="65" r="30" fill="#ddd"/><rect x="45" y="95" width="60" height="8" rx="4" fill="#ddd"/><rect x="55" y="108" width="40" height="6" rx="3" fill="#ddd"/><text x="50%" y="125" text-anchor="middle" font-size="10" fill="#999">${category || 'No Image'}</text></svg>`;
    imgElement.src = 'data:image/svg+xml,' + encodeURIComponent(fallbackSvg);
    imgElement.onerror = null;
}

window.resolveMedicineImage = resolveMedicineImage;
window.getCategoryIcon = getCategoryIcon;
window.createFallbackImage = createFallbackImage;
window.handleImageError = handleImageError;
