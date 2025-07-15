import React, { useState } from 'react';
import { X, Upload, Loader, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import useCategoryStore from '../stores/useCategoryStore';

const CreateCategoryForm = ({ onClose, onSuccess }) => {
    const { createCategory, loading } = useCategoryStore();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        isActive: true
    });
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Category name is required';
        } else if (formData.name.length > 50) {
            newErrors.name = 'Category name must be 50 characters or less';
        }
        
        if (formData.description && formData.description.length > 200) {
            newErrors.description = 'Description must be 200 characters or less';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        try {
            await createCategory(formData);
            onSuccess();
        } catch (error) {
            // Error is handled in the store
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleBackdropClick}>
            <motion.div 
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-700">
                    <h2 className="text-xl md:text-2xl font-bold text-emerald-300">Create New Category</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-300 transition-colors p-1 rounded"
                        disabled={loading}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
                    {/* Category Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter category name"
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                                errors.name ? 'border-red-500' : 'border-gray-600'
                            }`}
                            disabled={loading}
                            maxLength={50}
                        />
                        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                        <p className="text-gray-500 text-xs mt-1">{formData.name.length}/50 characters</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter category description (optional)"
                            rows={3}
                            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-colors ${
                                errors.description ? 'border-red-500' : 'border-gray-600'
                            }`}
                            disabled={loading}
                            maxLength={200}
                        />
                        {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
                        <p className="text-gray-500 text-xs mt-1">{formData.description.length}/200 characters</p>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Category Image
                        </label>
                        <div className="mt-1 flex items-center">
                            <input 
                                type="file" 
                                id="image" 
                                className="sr-only" 
                                accept="image/*" 
                                onChange={handleImageChange}
                                disabled={loading}
                            />
                            <label
                                htmlFor="image"
                                className="cursor-pointer bg-gray-700 py-2 px-3 border border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Upload className="h-5 w-5" />
                                Upload Image
                            </label>
                            {formData.image && <span className="ml-3 text-sm text-gray-400">Image uploaded</span>}
                        </div>
                        
                        {/* Image Preview */}
                        {formData.image && (
                            <div className="mt-3">
                                <img
                                    src={formData.image}
                                    alt="Category preview"
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-600"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500 focus:ring-2"
                            disabled={loading}
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                            Active (visible to customers)
                        </label>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-gray-600"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader className="h-5 w-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <PlusCircle className="h-5 w-5" />
                                    Create Category
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateCategoryForm;
