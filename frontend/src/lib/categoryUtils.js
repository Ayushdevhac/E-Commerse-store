// Utility functions for category handling

/**
 * Convert category slug to display name
 * @param {string} slug - The category slug
 * @returns {string} - The display name
 */
export const slugToDisplayName = (slug) => {
    if (!slug || typeof slug !== 'string') return 'Uncategorized';
    
    // Handle common slug patterns
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Convert display name to slug
 * @param {string} name - The display name
 * @returns {string} - The slug
 */
export const displayNameToSlug = (name) => {
    if (!name || typeof name !== 'string') return '';
    
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Find category display name from categories array
 * @param {string} slug - The category slug to find
 * @param {Array} categories - Array of category objects
 * @returns {string} - The display name
 */
export const getCategoryDisplayName = (slug, categories = []) => {
    if (!slug) return 'Uncategorized';
    
    // First try to find in categories array (for proper category objects)
    const category = categories.find(cat => 
        cat.slug === slug || 
        cat.name?.toLowerCase().replace(/\s+/g, '-') === slug
    );
    
    if (category) {
        return category.name;
    }
    
    // Fallback to slug conversion
    return slugToDisplayName(slug);
};
