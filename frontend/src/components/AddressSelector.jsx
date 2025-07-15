import { useState, useEffect } from 'react';
import { MapPin, Home, Briefcase, User, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useAddressStore } from '../stores/useAddressStore';
import AddressForm from './AddressForm';
import LoadingSpinner from './LoadingSpinner';

const AddressSelector = ({ selectedAddressId, onAddressSelect, className = '' }) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const { 
    addresses, 
    isLoading, 
    fetchAddresses, 
    deleteAddress, 
    setDefaultAddress 
  } = useAddressStore();

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Auto-select default address if no address is selected
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
      if (defaultAddress) {
        onAddressSelect(defaultAddress._id);
      }
    }
  }, [addresses, selectedAddressId, onAddressSelect]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'home': return <Home size={16} className="text-emerald-500" />;
      case 'work': return <Briefcase size={16} className="text-blue-500" />;
      default: return <User size={16} className="text-purple-500" />;
    }
  };

  const formatAddress = (address) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  const handleDelete = async (addressId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this address?')) {
      await deleteAddress(addressId);
      if (selectedAddressId === addressId) {
        const remainingAddresses = addresses.filter(addr => addr._id !== addressId);
        if (remainingAddresses.length > 0) {
          onAddressSelect(remainingAddresses[0]._id);
        }
      }
    }
  };

  const handleSetDefault = async (addressId, e) => {
    e.stopPropagation();
    await setDefaultAddress(addressId);
  };

  const handleEdit = (address, e) => {
    e.stopPropagation();
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  if (isLoading && addresses.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin size={20} className="text-emerald-500" />
          Shipping Address
        </h3>
        <button
          onClick={() => setShowAddressForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
        >
          <Plus size={16} />
          Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
          <MapPin size={48} className="mx-auto text-gray-500 mb-4" />
          <h4 className="text-lg font-medium text-white mb-2">No addresses found</h4>
          <p className="text-gray-400 mb-4">Add your first shipping address to continue</p>
          <button
            onClick={() => setShowAddressForm(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address._id}
              onClick={() => onAddressSelect(address._id)}
              className={`relative bg-gray-800 border-2 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-750 ${
                selectedAddressId === address._id
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Selection indicator */}
              {selectedAddressId === address._id && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                </div>
              )}              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(address.type)}
                    <span className="font-medium text-white capitalize">
                      {address.type}
                    </span>
                    {address.isDefault && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-1">
                    {formatAddress(address)}
                  </p>
                  
                  {address.country !== 'United States' && (
                    <p className="text-gray-400 text-sm">{address.country}</p>
                  )}
                </div>                {/* Action buttons */}
                <div className="flex items-center gap-2 bg-gray-900/50 p-1 rounded-lg">
                  {!address.isDefault && (
                    <button
                      onClick={(e) => handleSetDefault(address._id, e)}
                      className="p-2 bg-gray-700 hover:bg-emerald-600 text-gray-300 hover:text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Make default"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleEdit(address, e)}
                    className="p-2 bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Edit address"
                  >
                    <Edit2 size={16} />
                  </button>
                  {addresses.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(address._id, e)}
                      className="p-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Delete address"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressForm
          address={editingAddress}
          onClose={() => {
            setShowAddressForm(false);
            setEditingAddress(null);
          }}
          onSuccess={() => {
            fetchAddresses();
          }}
        />
      )}
    </div>
  );
};

export default AddressSelector;
