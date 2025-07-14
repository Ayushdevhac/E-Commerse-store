import { create } from 'zustand';
import axios from '../lib/axios';
import showToast from '../lib/toast';

export const useWishlistStore = create((set, get) => ({
    wishlist: [],
    loading: false,

    getWishlist: async () => {        set({ loading: true });
        try {
            const res = await axios.get('/wishlist');
            set({ wishlist: res.data, loading: false });
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            showToast.error(error.response?.data?.message || 'Failed to fetch wishlist');
            set({ loading: false });
        }
    },    addToWishlist: async (productId) => {
        try {
            const res = await axios.post('/wishlist/add', { productId });
            showToast.success('Added to wishlist');
            get().getWishlist(); // Refresh wishlist
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            showToast.error(error.response?.data?.message || 'Failed to add to wishlist');
        }
    },

    removeFromWishlist: async (productId) => {        try {
            await axios.delete(`/wishlist/${productId}`);
            showToast.success('Removed from wishlist');
            get().getWishlist(); // Refresh wishlist
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            showToast.error(error.response?.data?.message || 'Failed to remove from wishlist');
        }
    },    toggleWishlist: async (productId) => {
        try {
            const res = await axios.post('/wishlist/toggle', { productId });
            showToast.success(res.data.message);
            get().getWishlist(); // Refresh wishlist
            return res.data.isInWishlist;
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            showToast.error(error.response?.data?.message || 'Failed to update wishlist');
            return false;
        }
    },

    isInWishlist: (productId) => {
        const { wishlist } = get();
        return wishlist.some(item => item._id === productId);
    },

    clearWishlist: () => {
        set({ wishlist: [] });
    }
}));
