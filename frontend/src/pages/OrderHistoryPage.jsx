import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Calendar, DollarSign, Eye, ArrowLeft } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import showToast from "../lib/toast";

const OrderHistoryPage = () => {
	const { user } = useUserStore();
	const navigate = useNavigate();
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (user) {
			fetchOrderHistory();
		}
	}, [user]);

	const fetchOrderHistory = async () => {
		try {
			setLoading(true);
			const response = await axios.get("/orders/my-orders");
			setOrders(response.data);
		} catch (error) {
			console.error("Error fetching order history:", error);
			setError(error.response?.data?.message || "Failed to fetch order history");
			showToast.error("Failed to fetch order history");
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
		// Simple status logic - you can expand this based on your order model
		return order.status || "Completed";
	};

	const getStatusColor = (status) => {
		switch (status.toLowerCase()) {
			case "pending":
				return "text-yellow-400 bg-yellow-400/10";
			case "processing":
				return "text-blue-400 bg-blue-400/10";
			case "shipped":
				return "text-purple-400 bg-purple-400/10";
			case "delivered":
			case "completed":
				return "text-emerald-400 bg-emerald-400/10";
			case "cancelled":
				return "text-red-400 bg-red-400/10";
			default:
				return "text-gray-400 bg-gray-400/10";
		}
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white py-8 px-4">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex items-center gap-4 mb-8"
				>
					<button
						onClick={() => navigate(-1)}
						className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div>
						<h1 className="text-3xl font-bold text-emerald-400">Order History</h1>
						<p className="text-gray-400 mt-1">
							Track your purchases and order details
						</p>
					</div>
				</motion.div>

				{/* Error State */}
				{error && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6"
					>
						<p className="text-red-300">{error}</p>
					</motion.div>
				)}

				{/* Orders List */}
				{orders.length === 0 ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center py-16"
					>
						<Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
						<h2 className="text-xl font-semibold text-gray-300 mb-2">
							No Orders Yet
						</h2>
						<p className="text-gray-500 mb-6">
							You haven't placed any orders yet. Start shopping to see your order history here.
						</p>
						<button
							onClick={() => navigate("/")}
							className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
						>
							Start Shopping
						</button>
					</motion.div>
				) : (
					<div className="space-y-6">
						{orders.map((order, index) => (
							<motion.div
								key={order._id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="bg-gray-800 rounded-lg p-6 border border-gray-700"
							>
								{/* Order Header */}
								<div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
									<div className="flex items-center gap-4 mb-4 md:mb-0">
										<div>
											<h3 className="text-lg font-semibold text-white">
												Order #{order._id.slice(-6).toUpperCase()}
											</h3>
											<div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
												<span className="flex items-center gap-1">
													<Calendar className="w-4 h-4" />
													{formatDate(order.createdAt)}
												</span>
												<span className="flex items-center gap-1">
													<DollarSign className="w-4 h-4" />
													${order.totalAmount.toFixed(2)}
												</span>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getOrderStatus(order))}`}>
											{getOrderStatus(order)}
										</span>
										<button
											onClick={() => navigate(`/order/${order._id}`)}
											className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
										>
											<Eye className="w-4 h-4" />
											View Details
										</button>
									</div>
								</div>								{/* Products Summary */}
								<div className="border-t border-gray-700 pt-4">
									<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
										{/* Products */}
										<div className="lg:col-span-2">
											<h4 className="text-white font-medium mb-2">Items Ordered</h4>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
												{order.products.slice(0, 3).map((item, itemIndex) => (
													<div key={itemIndex} className="flex items-center gap-3">
														<div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
															<Package className="w-6 h-6 text-gray-400" />
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-white font-medium truncate">
																{item.product?.name || "Product"}
															</p>
															<p className="text-gray-400 text-sm">
																Qty: {item.quantity} × ${item.price.toFixed(2)}
															</p>
														</div>
													</div>
												))}
												{order.products.length > 3 && (
													<div className="flex items-center justify-center text-gray-400 text-sm">
														+{order.products.length - 3} more items
													</div>
												)}
											</div>
										</div>
										
										{/* Shipping Address Summary */}
										{order.shippingAddress && (
											<div>
												<h4 className="text-white font-medium mb-2">Ship To</h4>
												<div className="text-gray-400 text-sm">
													<p className="text-gray-300 font-medium">
														{order.shippingAddress.type && (
															<span className="capitalize bg-gray-700 px-2 py-1 rounded text-xs mr-2">
																{order.shippingAddress.type}
															</span>
														)}
													</p>
													<p>{order.shippingAddress.street}</p>
													<p>
														{order.shippingAddress.city}, {order.shippingAddress.state}
													</p>
													<p>{order.shippingAddress.zipCode}</p>
												</div>
											</div>
										)}
									</div>
								</div>
							</motion.div>
						))}
					</div>
				)}

				{/* Stats Summary */}
				{orders.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700"
					>
						<h2 className="text-xl font-semibold text-emerald-400 mb-4">
							Order Summary
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="text-center">
								<div className="text-2xl font-bold text-white">
									{orders.length}
								</div>
								<div className="text-gray-400">Total Orders</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-white">
									${orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
								</div>
								<div className="text-gray-400">Total Spent</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-white">
									${orders.length > 0 ? (orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length).toFixed(2) : "0.00"}
								</div>
								<div className="text-gray-400">Average Order</div>
							</div>
						</div>
					</motion.div>
				)}
			</div>
		</div>
	);
};

export default OrderHistoryPage;
