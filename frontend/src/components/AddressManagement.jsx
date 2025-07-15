import { useState, useEffect } from 'react';
import { MapPin, Plus, Home, Briefcase, User, Edit2, Trash2, Star } from 'lucide-react';
import { useAddressStore } from '../stores/useAddressStore';
import AddressForm from './AddressForm';
import LoadingSpinner from './LoadingSpinner';

const AddressManagement = () => {
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'home': return <Home size={20} className="text-emerald-500" />;
      case 'work': return <Briefcase size={20} className="text-blue-500" />;
      default: return <User size={20} className="text-purple-500" />;
    }
  };

  const formatAddress = (address) => {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
  };

  const handleDelete = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      await deleteAddress(addressId);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleSetDefault = async (addressId) => {
    await setDefaultAddress(addressId);
  };

  if (isLoading && addresses.length === 0) {
    return <LoadingSpinner message="Loading addresses..." />;
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <MapPin size={24} className="text-emerald-500" />
            My Addresses
          </h2>
          <p className="text-gray-300 text-sm md:text-base">
            Manage your shipping addresses
          </p>
        </div>
        <button
          onClick={() => setShowAddressForm(true)}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} />
          <span className="text-sm md:text-base">Add Address</span>
        </button>
      </div>

      {/* Addresses */}
      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin size={48} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No addresses found</h3>
          <p className="text-gray-400 mb-6">
            Add your first address to make checkout faster and easier
          </p>
          <button
            onClick={() => setShowAddressForm(true)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <div
              key={address._id}
              className="relative bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
            >
              {/* Default badge */}
              {address.isDefault && (
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                    <Star size={12} fill="currentColor" />
                    Default
                  </div>
                </div>
              )}

              {/* Address content */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  {getTypeIcon(address.type)}
                  <span className="font-medium text-white capitalize text-lg">
                    {address.type}
                  </span>
                </div>
                
                <div className="text-gray-300 space-y-1">
                  <p className="font-medium">{address.street}</p>
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                  {address.country !== 'United States' && (
                    <p className="text-gray-400">{address.country}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-600">
                <div className="flex items-center gap-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address._id)}
                      className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
                  <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="p-2 bg-gray-600 hover:bg-blue-600 text-gray-300 hover:text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Edit address"
                  >
                    <Edit2 size={16} />
                  </button>
                  {addresses.length > 1 && (
                    <button
                      onClick={() => handleDelete(address._id)}
                      className="p-2 bg-gray-600 hover:bg-red-600 text-gray-300 hover:text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
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

export default AddressManagement;
