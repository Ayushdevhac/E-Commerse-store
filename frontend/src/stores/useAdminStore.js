import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";

// Public function to fetch password requirements (not admin-protected)
export const fetchPasswordRequirements = async () => {
    try {
        const response = await axiosInstance.get("/admin/password-requirements");
        return response.data;
    } catch (error) {
        console.error("Error fetching password requirements:", error);
        // Return default values if fetch fails
        return { passwordMinLength: 8 };
    }
};

const useAdminStore = create((set, get) => ({
    cacheStats: null,
    databaseStats: null,
    securityStats: null,
    systemLogs: null,
    isClearing: false,
    statsLoading: false,
    dbStatsLoading: false,
    securityStatsLoading: false,
    logsLoading: false,
    updatingSettings: false,
    
    // Make axios instance available to components
    axiosInstance,

    // Clear all caches
    clearAllCaches: async () => {
        set({ isClearing: true });
        try {
            const response = await axiosInstance.post("/admin/cache/clear");
            
            if (response.data.success) {
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message || "Failed to clear caches");
            }
            
            // Refresh cache stats after clearing
            get().getCacheStats();
            
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to clear caches";
            toast.error(message);
            console.error("Error clearing caches:", error);
            throw error;
        } finally {
            set({ isClearing: false });
        }
    },

    // Clear specific cache type
    clearSpecificCache: async (cacheType) => {
        set({ isClearing: true });
        try {
            const response = await axiosInstance.post(`/admin/cache/clear/${cacheType}`);
            
            if (response.data.success) {
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message || `Failed to clear ${cacheType} cache`);
            }
            
            // Refresh cache stats after clearing
            get().getCacheStats();
            
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || `Failed to clear ${cacheType} cache`;
            toast.error(message);
            console.error(`Error clearing ${cacheType} cache:`, error);
            throw error;
        } finally {
            set({ isClearing: false });
        }
    },

    // Get cache statistics
    getCacheStats: async () => {
        set({ statsLoading: true });
        try {
            const response = await axiosInstance.get("/admin/cache/stats");
            set({ cacheStats: response.data });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to get cache statistics";
            console.error("Error getting cache stats:", error);
            set({ cacheStats: null });
            throw error;
        } finally {
            set({ statsLoading: false });
        }
    },    // Get database statistics
    getDatabaseStats: async () => {
        set({ dbStatsLoading: true });
        try {
            const response = await axiosInstance.get("/admin/database/stats");
            set({ databaseStats: response.data });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to get database statistics";
            console.error("Error getting database stats:", error);
            set({ databaseStats: null });
            throw error;
        } finally {
            set({ dbStatsLoading: false });
        }
    },

    // Get security statistics
    getSecurityStats: async () => {
        set({ securityStatsLoading: true });
        try {
            const response = await axiosInstance.get("/admin/security/stats");
            set({ securityStats: response.data });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to get security statistics";
            console.error("Error getting security stats:", error);
            set({ securityStats: null });
            throw error;
        } finally {
            set({ securityStatsLoading: false });
        }
    },

    // Update security settings
    updateSecuritySetting: async (setting, value) => {
        set({ updatingSettings: true });
        try {
            const response = await axiosInstance.put("/admin/security/settings", {
                setting,
                value
            });
            
            toast.success(response.data.message);
            
            // Refresh security stats after updating
            get().getSecurityStats();
            
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to update security setting";
            toast.error(message);
            console.error("Error updating security setting:", error);
            throw error;
        } finally {
            set({ updatingSettings: false });
        }
    },

    // Get system logs
    getSystemLogs: async (limit = 50, type = 'all') => {
        set({ logsLoading: true });
        try {
            const response = await axiosInstance.get("/admin/security/logs", {
                params: { limit, type }
            });
            set({ systemLogs: response.data });
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to get system logs";
            console.error("Error getting system logs:", error);
            set({ systemLogs: null });
            throw error;
        } finally {
            set({ logsLoading: false });
        }
    },
}));

export default useAdminStore;
