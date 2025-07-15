import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, ShoppingBag, Heart, Edit3, Save, X, ArrowLeft } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import showToast from "../lib/toast";

const UserProfilePage = () => {
	const { user, updateProfile } = useUserStore();
	const navigate = useNavigate();
	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [profileData, setProfileData] = useState({
		name: "",
		email: "",
		currentPassword: "",
		newPassword: "",
		confirmPassword: ""
	});
	const [stats, setStats] = useState({
		totalOrders: 0,
		totalSpent: 0,
		wishlistItems: 0,
		memberSince: ""
	});

	useEffect(() => {
		if (user) {
			setProfileData({
				name: user.name || "",
				email: user.email || "",
				currentPassword: "",
				newPassword: "",
				confirmPassword: ""
			});
			fetchUserStats();
		}
	}, [user]);

	const fetchUserStats = async () => {
		try {
			const response = await axios.get("/users/stats");
			setStats(response.data);
		} catch (error) {
			console.error("Error fetching user stats:", error);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setProfileData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSaveProfile = async () => {
		if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
			showToast.error("New passwords don't match");
			return;
		}

		if (profileData.newPassword && !profileData.currentPassword) {
			showToast.error("Current password is required to change password");
			return;
		}

		try {
			setLoading(true);
			const updateData = {
				name: profileData.name,
				email: profileData.email
			};

			if (profileData.newPassword) {
				updateData.currentPassword = profileData.currentPassword;
				updateData.newPassword = profileData.newPassword;
			}

			await axios.put("/users/profile", updateData);
			
			// Update the user store
			await updateProfile({
				name: profileData.name,
				email: profileData.email
			});

			showToast.success("Profile updated successfully");
			setIsEditing(false);
			setProfileData(prev => ({
				...prev,
				currentPassword: "",
				newPassword: "",
				confirmPassword: ""
			}));
		} catch (error) {
			console.error("Error updating profile:", error);
			showToast.error(error.response?.data?.message || "Failed to update profile");
		} finally {
			setLoading(false);
		}
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setProfileData({
			name: user.name || "",
			email: user.email || "",
			currentPassword: "",
			newPassword: "",
			confirmPassword: ""
		});
	};

	if (!user) {
		return <LoadingSpinner />;
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
						onClick={() => navigate(-1)}
						className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div>
						<h1 className="text-3xl font-bold text-emerald-400">My Profile</h1>
						<p className="text-gray-400 mt-1">
							Manage your account settings and preferences
						</p>
					</div>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Profile Information */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700"
					>
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold text-white">
								Profile Information
							</h2>
							{!isEditing ? (
								<button
									onClick={() => setIsEditing(true)}
									className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
								>
									<Edit3 className="w-4 h-4" />
									Edit Profile
								</button>
							) : (
								<div className="flex items-center gap-2">
									<button
										onClick={handleSaveProfile}
										disabled={loading}
										className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
									>
										<Save className="w-4 h-4" />
										{loading ? "Saving..." : "Save"}
									</button>
									<button
										onClick={handleCancelEdit}
										className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
									>
										<X className="w-4 h-4" />
										Cancel
									</button>
								</div>
							)}
						</div>

						<div className="space-y-6">
							{/* Name */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Name
								</label>
								{isEditing ? (
									<input
										type="text"
										name="name"
										value={profileData.name}
										onChange={handleInputChange}
										className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
									/>
								) : (
									<div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
										<User className="w-5 h-5 text-gray-400" />
										<span className="text-white">{user.name}</span>
									</div>
								)}
							</div>

							{/* Email */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Email
								</label>
								{isEditing ? (
									<input
										type="email"
										name="email"
										value={profileData.email}
										onChange={handleInputChange}
										className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
									/>
								) : (
									<div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
										<Mail className="w-5 h-5 text-gray-400" />
										<span className="text-white">{user.email}</span>
									</div>
								)}
							</div>

							{/* Password Change (only when editing) */}
							{isEditing && (
								<>
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Current Password
										</label>
										<input
											type="password"
											name="currentPassword"
											value={profileData.currentPassword}
											onChange={handleInputChange}
											placeholder="Enter current password to change password"
											className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											New Password
										</label>
										<input
											type="password"
											name="newPassword"
											value={profileData.newPassword}
											onChange={handleInputChange}
											placeholder="Enter new password (optional)"
											className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Confirm New Password
										</label>
										<input
											type="password"
											name="confirmPassword"
											value={profileData.confirmPassword}
											onChange={handleInputChange}
											placeholder="Confirm new password"
											className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
										/>
									</div>
								</>
							)}

							{/* Account Details */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Account Type
								</label>
								<div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
									<span className={`px-3 py-1 rounded-full text-sm font-medium ${
										user.role === 'admin' 
											? 'bg-purple-400/20 text-purple-400'
											: 'bg-emerald-400/20 text-emerald-400'
									}`}>
										{user.role === 'admin' ? 'Administrator' : 'Customer'}
									</span>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Member Since
								</label>
								<div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
									<Calendar className="w-5 h-5 text-gray-400" />
									<span className="text-white">
										{new Date(user.createdAt).toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric"
										})}
									</span>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Stats and Quick Actions */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="space-y-6"
					>
						{/* Account Stats */}
						<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
							<h3 className="text-lg font-semibold text-white mb-4">
								Account Statistics
							</h3>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-emerald-400/20 rounded-lg">
											<ShoppingBag className="w-5 h-5 text-emerald-400" />
										</div>
										<span className="text-gray-300">Total Orders</span>
									</div>
									<span className="text-white font-semibold">{stats.totalOrders}</span>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-blue-400/20 rounded-lg">
											<span className="text-blue-400 text-sm font-bold">$</span>
										</div>
										<span className="text-gray-300">Total Spent</span>
									</div>
									<span className="text-white font-semibold">${stats.totalSpent.toFixed(2)}</span>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-pink-400/20 rounded-lg">
											<Heart className="w-5 h-5 text-pink-400" />
										</div>
										<span className="text-gray-300">Wishlist Items</span>
									</div>
									<span className="text-white font-semibold">{stats.wishlistItems}</span>
								</div>
							</div>
						</div>

						{/* Quick Actions */}
						<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
							<h3 className="text-lg font-semibold text-white mb-4">
								Quick Actions
							</h3>
							<div className="space-y-3">
								<button
									onClick={() => navigate("/order-history")}
									className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
								>
									<div className="flex items-center gap-3">
										<ShoppingBag className="w-5 h-5 text-emerald-400" />
										<span className="text-white">View Order History</span>
									</div>
								</button>

								<button
									onClick={() => navigate("/wishlist")}
									className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
								>
									<div className="flex items-center gap-3">
										<Heart className="w-5 h-5 text-pink-400" />
										<span className="text-white">View Wishlist</span>
									</div>
								</button>

								<button
									onClick={() => navigate("/cart")}
									className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
								>
									<div className="flex items-center gap-3">
										<ShoppingBag className="w-5 h-5 text-blue-400" />
										<span className="text-white">View Cart</span>
									</div>
								</button>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	);
};

export default UserProfilePage;
