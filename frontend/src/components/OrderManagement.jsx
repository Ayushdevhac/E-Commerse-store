import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, Check, X, Eye, Clock, AlertCircle } from 'lucide-react';
import axios from '../lib/axios';
import showToast from '../lib/toast';
import LoadingSpinner from './LoadingSpinner';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [updating, setUpdating] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/orders/admin/all');
            setOrders(response.data.orders || response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            showToast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setUpdating(prev => ({ ...prev, [orderId]: true }));
            
            const response = await axios.patch(`/orders/admin/${orderId}/status`, {
                status: newStatus
            });
            
            // Update local state
            setOrders(prev => prev.map(order => 
                order._id === orderId 
                    ? { ...order, ...response.data.order }
                    : order
            ));
            
            showToast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating order status:', error);
            showToast.error('Failed to update order status');
        } finally {
            setUpdating(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-yellow-400 bg-yellow-400/10';
            case 'processing': return 'text-blue-400 bg-blue-400/10';
            case 'shipped': return 'text-purple-400 bg-purple-400/10';
            case 'delivered': return 'text-emerald-400 bg-emerald-400/10';
            case 'completed': return 'text-green-400 bg-green-400/10';
            case 'cancelled': return 'text-red-400 bg-red-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'processing': return <AlertCircle className="w-4 h-4" />;
            case 'shipped': return <Truck className="w-4 h-4" />;
            case 'delivered': return <Package className="w-4 h-4" />;
            case 'completed': return <Check className="w-4 h-4" />;
            case 'cancelled': return <X className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const getNextStatus = (currentStatus) => {
        const statusFlow = {
            'pending': 'processing',
            'processing': 'shipped',
            'shipped': 'delivered',
            'delivered': 'completed'
        };
        return statusFlow[currentStatus];
    };

    const canUpdateStatus = (status) => {
        return ['pending', 'processing', 'shipped', 'delivered'].includes(status);
    };

    const filteredOrders = orders.filter(order => 
        filterStatus === 'all' || order.status === filterStatus
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Order Management</h2>
                <button
                    onClick={fetchOrders}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Status Filter */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filter by Status
                </label>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="pb-3 text-gray-300 font-medium">Order ID</th>
                            <th className="pb-3 text-gray-300 font-medium">Customer</th>
                            <th className="pb-3 text-gray-300 font-medium">Total</th>
                            <th className="pb-3 text-gray-300 font-medium">Status</th>
                            <th className="pb-3 text-gray-300 font-medium">Created</th>
                            <th className="pb-3 text-gray-300 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order) => {
                            const nextStatus = getNextStatus(order.status);
                            const isUpdating = updating[order._id];
                            
                            return (
                                <motion.tr
                                    key={order._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="border-b border-gray-700/50 hover:bg-gray-700/30"
                                >
                                    <td className="py-4 text-sm text-gray-300">
                                        {order._id.slice(-8)}
                                    </td>
                                    <td className="py-4 text-sm text-white">
                                        {order.user?.name || order.user?.email || 'N/A'}
                                    </td>
                                    <td className="py-4 text-sm text-emerald-400 font-medium">
                                        ${order.totalAmount?.toFixed(2)}
                                    </td>
                                    <td className="py-4">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm text-gray-400">
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex gap-2">                                            {/* View Details Button */}
                                            <button
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowOrderModal(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-emerald-400 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            
                                            {/* Update Status Button */}
                                            {canUpdateStatus(order.status) && nextStatus && (
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, nextStatus)}
                                                    disabled={isUpdating}
                                                    className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={`Update to ${nextStatus}`}
                                                >
                                                    {isUpdating ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                    ) : (
                                                        `→ ${nextStatus}`
                                                    )}
                                                </button>
                                            )}
                                            
                                            {/* Cancel Button for applicable statuses */}
                                            {['pending', 'processing'].includes(order.status) && (
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                                    disabled={isUpdating}
                                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Cancel Order"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
                
                {filteredOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        No orders found for the selected filter.
                    </div>
                )}
            </div>            {/* Order Statistics */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-4">
                {['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'].map(status => {
                    const count = orders.filter(order => order.status === status).length;
                    return (
                        <div key={status} className="bg-gray-700 rounded-lg p-3 text-center">
                            <div className={`text-lg font-bold ${getStatusColor(status).split(' ')[0]}`}>
                                {count}
                            </div>
                            <div className="text-xs text-gray-400 capitalize">{status}</div>
                        </div>
                    );
                })}
            </div>

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    Order Details - #{selectedOrder._id.slice(-8)}
                                </h2>
                                <button
                                    onClick={() => setShowOrderModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Order Information */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Order Information</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Status:</span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                                                    {selectedOrder.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Total Amount:</span>
                                                <span className="text-emerald-400 font-medium">${selectedOrder.totalAmount?.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Payment Status:</span>
                                                <span className="text-white">{selectedOrder.paymentStatus}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Created:</span>
                                                <span className="text-white">{formatDate(selectedOrder.createdAt)}</span>
                                            </div>
                                            {selectedOrder.shippedAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Shipped:</span>
                                                    <span className="text-white">{formatDate(selectedOrder.shippedAt)}</span>
                                                </div>
                                            )}
                                            {selectedOrder.deliveredAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Delivered:</span>
                                                    <span className="text-white">{formatDate(selectedOrder.deliveredAt)}</span>
                                                </div>
                                            )}
                                            {selectedOrder.completedAt && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Completed:</span>
                                                    <span className="text-white">{formatDate(selectedOrder.completedAt)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Customer</h3>
                                        <div className="text-sm text-gray-300">
                                            <p>{selectedOrder.user?.name || 'N/A'}</p>
                                            <p>{selectedOrder.user?.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Information */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Shipping Address</h3>
                                        {selectedOrder.shippingAddress ? (
                                            <div className="text-sm text-gray-300 space-y-1">
                                                {selectedOrder.shippingAddress.type && (
                                                    <p>
                                                        <span className="capitalize bg-gray-700 px-2 py-1 rounded text-xs mr-2">
                                                            {selectedOrder.shippingAddress.type}
                                                        </span>
                                                    </p>
                                                )}
                                                <p>{selectedOrder.shippingAddress.street}</p>
                                                <p>
                                                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                                                </p>
                                                <p>{selectedOrder.shippingAddress.country}</p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-sm">No shipping address provided</p>
                                        )}
                                    </div>

                                    {/* Tracking Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Tracking</h3>
                                        <div className="text-sm text-gray-300 space-y-1">
                                            {selectedOrder.trackingNumber ? (
                                                <p>
                                                    <span className="text-gray-400">Tracking:</span> {selectedOrder.trackingNumber}
                                                </p>
                                            ) : (
                                                <p className="text-gray-400">No tracking number assigned</p>
                                            )}
                                            {selectedOrder.estimatedDelivery && (
                                                <p>
                                                    <span className="text-gray-400">Estimated Delivery:</span> {formatDate(selectedOrder.estimatedDelivery)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-white mb-3">Products</h3>
                                <div className="space-y-3">
                                    {selectedOrder.products?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-700 rounded-lg">
                                            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                                                <Package className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium">
                                                    {item.product?.name || 'Product'}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    Quantity: {item.quantity} × ${item.price?.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-emerald-400 font-medium">
                                                ${(item.quantity * item.price)?.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
