import { create } from 'zustand';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

export const useAddressStore = create((set, get) => ({
  addresses: [],
  isLoading: false,
  
  // Fetch all user addresses
  fetchAddresses: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get('/addresses');
      set({ addresses: response.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch addresses');
      set({ isLoading: false });
    }
  },

  // Add a new address
  addAddress: async (addressData) => {
    set({ isLoading: true });
    try {
      const response = await axios.post('/addresses', addressData);
      set((state) => ({ 
        addresses: [...state.addresses, response.data.address],
        isLoading: false 
      }));
      toast.success('Address added successfully');
      return response.data.address;
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error(error.response?.data?.message || 'Failed to add address');
      set({ isLoading: false });
      throw error;
    }
  },

  // Update an existing address
  updateAddress: async (addressId, addressData) => {
    set({ isLoading: true });
    try {
      const response = await axios.put(`/addresses/${addressId}`, addressData);
      set((state) => ({
        addresses: state.addresses.map(addr =>
          addr._id === addressId ? response.data.address : addr
        ),
        isLoading: false
      }));
      toast.success('Address updated successfully');
      return response.data.address;
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error(error.response?.data?.message || 'Failed to update address');
      set({ isLoading: false });
      throw error;
    }
  },

  // Delete an address
  deleteAddress: async (addressId) => {
    set({ isLoading: true });
    try {
      await axios.delete(`/addresses/${addressId}`);
      set((state) => ({
        addresses: state.addresses.filter(addr => addr._id !== addressId),
        isLoading: false
      }));
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error(error.response?.data?.message || 'Failed to delete address');
      set({ isLoading: false });
      throw error;
    }
  },

  // Set default address
  setDefaultAddress: async (addressId) => {
    set({ isLoading: true });
    try {
      const response = await axios.patch(`/addresses/${addressId}/default`);
      set((state) => ({
        addresses: state.addresses.map(addr => ({
          ...addr,
          isDefault: addr._id === addressId
        })),
        isLoading: false
      }));
      toast.success('Default address updated');
      return response.data.address;
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error(error.response?.data?.message || 'Failed to set default address');
      set({ isLoading: false });
      throw error;
    }
  },

  // Get default address
  getDefaultAddress: () => {
    const { addresses } = get();
    return addresses.find(addr => addr.isDefault) || addresses[0] || null;
  },

  // Clear addresses (for logout)
  clearAddresses: () => {
    set({ addresses: [], isLoading: false });
  }
}));
