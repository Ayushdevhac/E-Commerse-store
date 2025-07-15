import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Truck, Calendar, DollarSign, MapPin, Phone } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import axios from "../lib/axios";
import showToast from "../lib/toast";

const OrderDetailPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [order, setOrder] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchOrderDetails();
	}, [id]);

	const fetchOrderDetails = async () => {
		try {
			setLoading(true);
			const response = await axios.get(`/orders/${id}`);
			setOrder(response.data);
		} catch (error) {
			console.error("Error fetching order details:", error);
			setError(error.response?.data?.message || "Failed to fetch order details");
			showToast.error("Failed to fetch order details");
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	};

	const getOrderStatus = (order) => {
		return order.status || "Completed";
	};

	const getStatusColor = (status) => {
		switch (status.toLowerCase()) {
			case "pending":
				return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
			case "processing":
				return "text-blue-400 bg-blue-400/10 border-blue-400/20";
			case "shipped":
				return "text-purple-400 bg-purple-400/10 border-purple-400/20";
			case "delivered":
			case "completed":
				return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
			case "cancelled":
				return "text-red-400 bg-red-400/10 border-red-400/20";
			default:
				return "text-gray-400 bg-gray-400/10 border-gray-400/20";
		}
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	if (error || !order) {
		return (
			<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-white mb-4">
						{error || "Order not found"}
					</h2>
					<button
						onClick={() => navigate("/order-history")}
						className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
					>
						Back to Order History
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white py-8 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-center gap-4 mb-8"
				>
					<button
						onClick={() => navigate("/order-history")}
						className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div>
						<h1 className="text-3xl font-bold text-emerald-400">
							Order #{order._id.slice(-6).toUpperCase()}
						</h1>
						<p className="text-gray-400 mt-1">
							Order details and tracking information
						</p>
					</div>
				</motion.div>

				{/* Order Status */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6"
				>
					<div className="flex flex-col md:flex-row md:items-center justify-between">
						<div className="mb-4 md:mb-0">
							<h2 className="text-xl font-semibold text-white mb-2">Order Status</h2>
							<span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(getOrderStatus(order))}`}>
								{getOrderStatus(order)}
							</span>
						</div>
						<div className="text-right">
							<div className="text-sm text-gray-400 mb-1">Order Date</div>
							<div className="text-white font-medium">{formatDate(order.createdAt)}</div>
						</div>
					</div>
				</motion.div>

				{/* Order Summary */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6"
				>
					<h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
						<div className="text-center">
							<div className="text-2xl font-bold text-emerald-400">
								{order.products.length}
							</div>
							<div className="text-gray-400">Items</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-emerald-400">
								${order.totalAmount.toFixed(2)}
							</div>
							<div className="text-gray-400">Total Amount</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-emerald-400">
								{order.stripeSessionId ? "Paid" : "Pending"}
							</div>
							<div className="text-gray-400">Payment Status</div>
						</div>
					</div>
				</motion.div>

				{/* Products List */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6"
				>
					<h2 className="text-xl font-semibold text-white mb-4">Items Ordered</h2>
					<div className="space-y-4">
						{order.products.map((item, index) => (
							<div key={index} className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
								<div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
									{item.product?.image ? (
										<img 
											src={item.product.image} 
											alt={item.product.name}
											className="w-full h-full object-cover rounded-lg"
										/>
									) : (
										<Package className="w-8 h-8 text-gray-400" />
									)}
								</div>
								<div className="flex-1">
									<h3 className="text-white font-medium">
										{item.product?.name || "Product"}
									</h3>
									<p className="text-gray-400 text-sm">
										{item.product?.description?.substring(0, 100)}...
									</p>
									<div className="flex items-center gap-4 mt-2">
										<span className="text-gray-400">Qty: {item.quantity}</span>
										<span className="text-emerald-400 font-medium">
											${item.price.toFixed(2)} each
										</span>
									</div>
								</div>
								<div className="text-right">
									<div className="text-white font-semibold">
										${(item.price * item.quantity).toFixed(2)}
									</div>
								</div>
							</div>
						))}
					</div>
				</motion.div>				{/* Shipping Information */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="bg-gray-800 rounded-lg p-6 border border-gray-700"
				>
					<h2 className="text-xl font-semibold text-white mb-4">Shipping Information</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h3 className="text-white font-medium mb-2 flex items-center gap-2">
								<MapPin className="w-4 h-4" />
								Shipping Address
							</h3>
							<div className="text-gray-400 text-sm">
								{order.shippingAddress ? (
									<>
										<p className="font-medium text-gray-300 mb-1">
											{order.shippingAddress.type && (
												<span className="capitalize bg-gray-700 px-2 py-1 rounded text-xs mr-2">
													{order.shippingAddress.type}
												</span>
											)}
										</p>
										<p>{order.shippingAddress.street}</p>
										<p>
											{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
										</p>
										<p>{order.shippingAddress.country}</p>
									</>
								) : (
									<p>No shipping address provided</p>
								)}
								<p className="mt-2 text-emerald-400">
									{order.estimatedDelivery 
										? `Estimated delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}`
										: "Estimated delivery: 3-5 business days"
									}
								</p>
							</div>
						</div>
						<div>
							<h3 className="text-white font-medium mb-2 flex items-center gap-2">
								<Truck className="w-4 h-4" />
								Tracking Information
							</h3>
							<div className="text-gray-400 text-sm">
								{order.trackingNumber ? (
									<>
										<p className="font-medium text-emerald-400">
											Tracking Number: {order.trackingNumber}
										</p>
										<p>Click to track your package</p>
									</>
								) : (
									<p>
										{order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed'
											? "Tracking number will be updated soon"
											: "Tracking number will be provided once shipped"
										}
									</p>
								)}
								{order.shippedAt && (
									<p className="mt-2 text-emerald-400">
										Shipped on: {formatDate(order.shippedAt)}
									</p>
								)}
								{order.deliveredAt && (
									<p className="mt-1 text-green-400">
										Delivered on: {formatDate(order.deliveredAt)}
									</p>
								)}
								<p className="mt-2">You'll receive email updates on delivery status</p>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	);
};

export default OrderDetailPage;
