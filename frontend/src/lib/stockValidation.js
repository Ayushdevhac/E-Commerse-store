// Frontend stock validation utilities - mirror backend logic
export function getAvailableStock(product, selectedSize) {
    if (!product || !product.stock) return 0;
    
    if (product.sizes && product.sizes.length > 0) {
        if (!selectedSize) return null;
        // Handle both Map and object formats
        if (typeof product.stock.get === 'function') {
            return Math.max(0, parseInt(product.stock.get(selectedSize)) || 0);
        } else if (typeof product.stock === 'object') {
            return Math.max(0, parseInt(product.stock[selectedSize]) || 0);
        }
        return 0;
    } else {
        // For products without sizes
        return typeof product.stock === 'number' ? Math.max(0, parseInt(product.stock) || 0) : 0;
    }
}

export function validateQuantity(product, selectedSize, quantity) {
    const available = getAvailableStock(product, selectedSize);
    
    if (available === null) {
        return { isValid: false, availableStock: 0, message: 'Please select a size' };
    }
    
    if (quantity <= 0) {
        return { isValid: false, availableStock: available, message: 'Quantity must be at least 1' };
    }
    
    if (quantity > available) {
        const suffix = selectedSize ? ` for size ${selectedSize}` : '';
        return { isValid: false, availableStock: available, message: `Only ${available} item(s) available${suffix}` };
    }
    
    return { isValid: true, availableStock: available };
}

export function isOutOfStock(product, selectedSize) {
    return getAvailableStock(product, selectedSize) === 0;
}

// Legacy compatibility function
export const validateStock = (product, size = null, requestedQuantity = 1) => {
    return validateQuantity(product, size, requestedQuantity);
};

export const formatStockMessage = (availableStock, size = null) => {
    if (availableStock <= 0) {
        return `Out of stock${size ? ` for size ${size}` : ''}`;
    }
    if (availableStock <= 5) {
        return `⚠️ Only ${availableStock} left in stock${size ? ` for size ${size}` : ''}!`;
    }
    return `${availableStock} available${size ? ` for size ${size}` : ''}`;
};
