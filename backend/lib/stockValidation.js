// Utility functions for stock validation in cart and product operations
export function getAvailableStock(product, size) {
    if (product.sizes && product.sizes.length > 0) {
        if (!size) return null;
        const stockValue = product.stock.get ? product.stock.get(size) : product.stock[size];
        return Math.max(0, parseInt(stockValue) || 0);
    }
    return typeof product.stock === 'number' ? Math.max(0, parseInt(product.stock) || 0) : 0;
}

export function validateStock(product, size, quantity) {
    const available = getAvailableStock(product, size);
    if (available === null) {
        return { isValid: false, availableStock: 0, message: 'Size selection required' };
    }
    if (quantity <= 0) {
        return { isValid: false, availableStock: available, message: 'Quantity must be at least 1' };
    }
    if (quantity > available) {
        const suffix = size ? ` for size ${size}` : '';
        return { isValid: false, availableStock: available, message: `Only ${available} item(s) available${suffix}` };
    }
    return { isValid: true, availableStock: available };
}
