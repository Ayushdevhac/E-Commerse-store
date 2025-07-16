import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import useCategoryStore from '../stores/useCategoryStore';
import CreateCategoryForm from './CreateCategoryForm';
import EditCategoryForm from './EditCategoryForm';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';

const CategoryManagement = () => {
    const {
        categories,
        loading,
        currentPage,
        totalPages,
        totalCategories,
        fetchCategories,
        deleteCategory,
        toggleCategoryStatus
    } = useCategoryStore();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState('all');
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        const activeFilter = filterActive === 'all' ? undefined : filterActive === 'active';
        fetchCategories(1, 10, activeFilter);
    }, [fetchCategories, filterActive]);

    const handlePageChange = (page) => {
        const activeFilter = filterActive === 'all' ? undefined : filterActive === 'active';
        fetchCategories(page, 10, activeFilter);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };    const handleDelete = async (id) => {
        if (confirmDelete === id) {
            try {
                await deleteCategory(id);
                setConfirmDelete(null);
                // Refresh the category list
                const activeFilter = filterActive === 'all' ? undefined : filterActive === 'active';
                fetchCategories(currentPage, 10, activeFilter);
            } catch (error) {
                console.error('Category deletion failed:', error);
            }
        } else {
            setConfirmDelete(id);
            toast('Click again to confirm deletion', {
                icon: '⚠️',
                duration: 4000,
            });
            // Clear confirmation after 5 seconds
            setTimeout(() => {
                if (confirmDelete === id) {
                    setConfirmDelete(null);
                }
            }, 5000);
        }
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && categories.length === 0) {
        return <LoadingSpinner />;
    }    return (
        <div className="bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Category Management</h2>
                    <p className="text-gray-300 text-sm md:text-base">Manage your product categories</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    <span className="text-sm md:text-base">Add Category</span>
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={filterActive}
                        onChange={(e) => setFilterActive(e.target.value)}
                        className="pl-10 pr-8 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        <option value="all">All Categories</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>            {/* Categories Table/Cards */}
            <div className="overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">                    <table className="min-w-full table-auto">
                        <thead className="bg-gray-700"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th></tr></thead><tbody className="bg-gray-800 divide-y divide-gray-700">{filteredCategories.map((category) => (
                                <tr key={category._id} className="hover:bg-gray-700"><td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center">
                                            {category.image && (
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    className="h-10 w-10 rounded-lg object-cover mr-3"
                                                />
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    {category.name}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {category.slug}
                                                </div>
                                            </div>                                        </div>
                                    </td><td className="px-6 py-4">
                                        <div className="text-sm text-white max-w-xs truncate">
                                            {category.description || 'No description'}
                                        </div>
                                    </td><td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            category.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'                                        }`}>
                                            {category.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {new Date(category.createdAt).toLocaleDateString()}
                                    </td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => toggleCategoryStatus(category._id)}
                                                className={`p-1 rounded transition-colors ${
                                                    category.isActive
                                                        ? 'text-gray-400 hover:text-gray-200'
                                                        : 'text-green-400 hover:text-green-300'
                                                }`}
                                                title={category.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {category.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                onClick={() => setEditingCategory(category)}
                                                className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category._id)}
                                                className={`p-1 rounded transition-colors ${
                                                    confirmDelete === category._id
                                                        ? 'text-red-300 bg-red-900'
                                                        : 'text-red-400 hover:text-red-300'
                                                }`}
                                                title={confirmDelete === category._id ? 'Click again to confirm' : 'Delete'}
                                            >
                                                <Trash2 size={16} />                                            </button>
                                        </div></td></tr>
                            ))}</tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                    {filteredCategories.map((category) => (
                        <div key={category._id} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    {category.image && (
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            className="h-12 w-12 rounded-lg object-cover"
                                        />
                                    )}
                                    <div>
                                        <h3 className="font-medium text-white">{category.name}</h3>
                                        <p className="text-sm text-gray-400">{category.slug}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    category.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {category.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            
                            {category.description && (
                                <p className="text-sm text-gray-300 mb-3">{category.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                    Created: {new Date(category.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => toggleCategoryStatus(category._id)}
                                        className={`p-2 rounded transition-colors ${
                                            category.isActive
                                                ? 'text-gray-400 hover:text-gray-200 bg-gray-700'
                                                : 'text-green-400 hover:text-green-300 bg-gray-700'
                                        }`}
                                    >
                                        {category.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button
                                        onClick={() => setEditingCategory(category)}
                                        className="text-blue-400 hover:text-blue-300 p-2 rounded bg-gray-700 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>                                    <button
                                        onClick={() => handleDelete(category._id)}
                                        className={`p-2 rounded transition-colors ${
                                            confirmDelete === category._id
                                                ? 'text-red-300 bg-red-900'
                                                : 'text-red-400 hover:text-red-300 bg-gray-700'
                                        }`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}

            {/* Stats */}
            <div className="mt-6 text-center text-sm text-gray-400">
                Showing {filteredCategories.length} of {totalCategories} categories
            </div>

            {/* Modals */}
            {showCreateForm && (
                <CreateCategoryForm
                    onClose={() => setShowCreateForm(false)}
                    onSuccess={() => {
                        setShowCreateForm(false);
                        fetchCategories(currentPage, 10);
                    }}
                />
            )}

            {editingCategory && (
                <EditCategoryForm
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSuccess={() => {
                        setEditingCategory(null);
                        fetchCategories(currentPage, 10);
                    }}
                />
            )}
        </div>
    );
};

export default CategoryManagement;
