import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";

const useCategoryStore = create((set, get) => ({
    categories: [],
    activeCategories: [],
    loading: false,
    currentPage: 1,
    totalPages: 1,
    totalCategories: 0,

    // Fetch all categories (admin)
    fetchCategories: async (page = 1, limit = 20, active) => {
        set({ loading: true });
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
            if (active !== undefined) {
                params.append('active', active.toString());
            }
            
            const response = await axiosInstance.get(`/categories?${params}`);
            set({
                categories: response.data.categories,
                currentPage: response.data.currentPage,
                totalPages: response.data.totalPages,
                totalCategories: response.data.totalCategories,
                loading: false,
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch categories");
            set({ loading: false });
        }
    },    // Fetch active categories (public)
    fetchActiveCategories: async () => {
        try {
            const response = await axiosInstance.get("/categories/active");
            set({ activeCategories: response.data });
        } catch (error) {
            console.error("Failed to fetch active categories:", error);
        }
    },

    // Get category by ID
    getCategoryById: async (id) => {
        try {
            const response = await axiosInstance.get(`/categories/${id}`);
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch category");
            return null;
        }
    },

    // Create category
    createCategory: async (categoryData) => {
        set({ loading: true });
        try {
            const response = await axiosInstance.post("/categories", categoryData);
            set((state) => ({
                categories: [...state.categories, response.data.category],
                totalCategories: state.totalCategories + 1,
                loading: false,
            }));
            toast.success("Category created successfully");
            return response.data.category;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create category");
            set({ loading: false });
            throw error;
        }
    },

    // Update category
    updateCategory: async (id, categoryData) => {
        set({ loading: true });
        try {
            const response = await axiosInstance.put(`/categories/${id}`, categoryData);
            set((state) => ({
                categories: state.categories.map((cat) =>
                    cat._id === id ? response.data.category : cat
                ),
                loading: false,
            }));
            toast.success("Category updated successfully");
            return response.data.category;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update category");
            set({ loading: false });
            throw error;
        }
    },

    // Delete category
    deleteCategory: async (id) => {
        set({ loading: true });
        try {
            await axiosInstance.delete(`/categories/${id}`);
            set((state) => ({
                categories: state.categories.filter((cat) => cat._id !== id),
                totalCategories: state.totalCategories - 1,
                loading: false,
            }));
            toast.success("Category deleted successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete category");
            set({ loading: false });
        }
    },

    // Toggle category status
    toggleCategoryStatus: async (id) => {
        try {
            const response = await axiosInstance.patch(`/categories/${id}/toggle`);
            set((state) => ({
                categories: state.categories.map((cat) =>
                    cat._id === id ? response.data.category : cat
                ),
            }));
            toast.success(response.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to toggle category status");
        }
    },
}));

export default useCategoryStore;
