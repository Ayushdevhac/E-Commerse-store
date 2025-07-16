import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, ChevronDown } from 'lucide-react';

const ProductFilters = ({ 
    filters, 
    onFiltersChange, 
    categories = [],
    onClearFilters,
    isLoading = false 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);
    const debounceRef = useRef(null);    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    // Cleanup debounce timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const handleLocalChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handlePriceChange = (key, value) => {
        const numValue = value === '' ? null : parseFloat(value);
        const newFilters = { ...localFilters, [key]: numValue };
        setLocalFilters(newFilters);
        
        // Debounce price filter changes to avoid too many API calls
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        
        debounceRef.current = setTimeout(() => {
            onFiltersChange(newFilters);
        }, 500); // 500ms debounce
    };

    const sortOptions = [
        { value: '-createdAt', label: 'Newest First' },
        { value: 'createdAt', label: 'Oldest First' },
        { value: 'name', label: 'Name A-Z' },
        { value: '-name', label: 'Name Z-A' },
        { value: 'price', label: 'Price Low-High' },
        { value: '-price', label: 'Price High-Low' }
    ];

    const hasActiveFilters = localFilters.category || 
                           localFilters.minPrice > 0 || 
                           localFilters.maxPrice || 
                           localFilters.search;

    return (
        <div className="relative">
            {/* Mobile filter toggle */}
            <div className="md:hidden mb-4">
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg w-full justify-between"
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="flex items-center gap-2">
                        <Filter size={16} />
                        <span>Filters</span>
                        {hasActiveFilters && (
                            <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                                Active
                            </span>
                        )}
                    </div>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={16} />
                    </motion.div>
                </motion.button>
            </div>

            {/* Filter panel */}
            <motion.div
                className={`bg-gray-800 rounded-lg p-4 ${
                    isOpen || window.innerWidth >= 768 ? 'block' : 'hidden'
                } md:block`}
                initial={false}
                animate={{ 
                    height: isOpen || window.innerWidth >= 768 ? 'auto' : 0,
                    opacity: isOpen || window.innerWidth >= 768 ? 1 : 0 
                }}
                transition={{ duration: 0.3 }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Category Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Category
                        </label>                        <select
                            value={localFilters.category || ''}
                            onChange={(e) => handleLocalChange('category', e.target.value || null)}
                            className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                            disabled={isLoading}
                        >
                            <option value="">All Categories</option>
                            {categories
                                .filter(cat => cat._id && isNaN(cat._id)) // Filter out numeric categories
                                .map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat._id.charAt(0).toUpperCase() + cat._id.slice(1)} ({cat.count})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Min Price
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={localFilters.minPrice || ''}
                            onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Max Price
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="No limit"
                            value={localFilters.maxPrice || ''}
                            onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Sort By
                        </label>
                        <select
                            value={localFilters.sort || '-createdAt'}
                            onChange={(e) => handleLocalChange('sort', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none"
                            disabled={isLoading}
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Clear filters button */}
                {hasActiveFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <motion.button
                            onClick={onClearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading}
                        >
                            <X size={16} />
                            Clear All Filters
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ProductFilters;
