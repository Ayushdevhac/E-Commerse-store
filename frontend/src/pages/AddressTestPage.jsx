import { useState } from 'react';
import AddressManagement from '../components/AddressManagement';
import AddressSelector from '../components/AddressSelector';
import LoadingSpinner from '../components/LoadingSpinner';

const AddressTestPage = () => {
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showSpinnerDemo, setShowSpinnerDemo] = useState(false);
  const [spinnerVariant, setSpinnerVariant] = useState('default');

  const spinnerVariants = ['default', 'pulse', 'dots', 'bars', 'ring'];

  const toggleSpinnerDemo = () => {
    setShowSpinnerDemo(!showSpinnerDemo);
  };

  if (showSpinnerDemo) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={toggleSpinnerDemo}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            ← Back to Address Management
          </button>
        </div>
        <div className="absolute top-4 right-4 z-50">
          <select
            value={spinnerVariant}
            onChange={(e) => setSpinnerVariant(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {spinnerVariants.map(variant => (
              <option key={variant} value={variant}>
                {variant.charAt(0).toUpperCase() + variant.slice(1)} Spinner
              </option>
            ))}
          </select>
        </div>
        <LoadingSpinner 
          variant={spinnerVariant}
          message="Testing the enhanced loading spinner"
          size="xl"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Address Management & LoadingSpinner Demo</h1>
          <p className="text-gray-300">
            This page demonstrates the new address management functionality and enhanced LoadingSpinner component.
          </p>
          <div className="mt-4 space-x-4">
            <button
              onClick={toggleSpinnerDemo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View LoadingSpinner Demo
            </button>
          </div>
        </div>

        {/* Address Management */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Full Address Management */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Address Management Component</h2>
            <p className="text-gray-400 mb-4 text-sm">
              Full address management with add, edit, delete, and set default functionality.
            </p>
            <AddressManagement />
          </div>

          {/* Address Selector (for checkout) */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Address Selector Component</h2>
            <p className="text-gray-400 mb-4 text-sm">
              Address selector component used during checkout process.
            </p>
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <AddressSelector
                selectedAddressId={selectedAddressId}
                onAddressSelect={setSelectedAddressId}
              />
              {selectedAddressId && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-400 text-sm">
                    ✓ Selected Address ID: {selectedAddressId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LoadingSpinner Examples */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4">LoadingSpinner Variants (Small Demos)</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {spinnerVariants.map(variant => (
              <div key={variant} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-medium text-white mb-4 capitalize">{variant} Spinner</h3>
                <div className="h-32">
                  <LoadingSpinner 
                    variant={variant}
                    size="medium"
                    message=""
                    fullScreen={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-12 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Features Implemented</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Address Management Features</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Add, edit, and delete addresses
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Set default shipping address
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Address validation (street, city, state, zip)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Address types (home, work, other)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Integrated with checkout process
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Responsive design with mobile support
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-3">LoadingSpinner Enhancements</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  5 different spinner variants
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Customizable sizes (small, medium, large, xl)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Custom loading messages
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Smooth animations with Framer Motion
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Full screen or inline display options
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Consistent dark theme design
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressTestPage;
