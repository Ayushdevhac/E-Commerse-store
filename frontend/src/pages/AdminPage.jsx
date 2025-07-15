import { BarChart, PlusCircle, ShoppingBasket, Crown, Settings, Grid, Activity, CreditCard, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import VipCouponManager from "../components/VipCouponManager";
import CategoryManagement from "../components/CategoryManagement";
import AdminSettings from "../components/AdminSettings";
import AdminPerformanceTab from "../components/AdminPerformanceTab";
import TestPaymentComponent from "../components/TestPaymentComponent";
import OrderManagement from "../components/OrderManagement";
import { useProductStore } from "../stores/useProductStore";
import useCategoryStore from "../stores/useCategoryStore";

const tabs = [
	{ id: "create", label: "Create Product", icon: PlusCircle },
	{ id: "products", label: "Products", icon: ShoppingBasket },
	{ id: "orders", label: "Orders", icon: Package },
	{ id: "categories", label: "Categories", icon: Grid },
	{ id: "analytics", label: "Analytics", icon: BarChart },
	{ id: "performance", label: "Performance", icon: Activity },
	{ id: "payments", label: "Payment Tests", icon: CreditCard },
	{ id: "vip", label: "VIP Coupons", icon: Crown },
	{ id: "settings", label: "Settings", icon: Settings },
];

const AdminPage = () => {
	const [activeTab, setActiveTab] = useState("create");
	const { fetchAllProducts } = useProductStore();
	const { fetchCategories } = useCategoryStore();

	useEffect(() => {
		// Fetch initial data for admin dashboard
		fetchAllProducts(1, { sort: '-createdAt' });
		fetchCategories();
	}, [fetchAllProducts, fetchCategories]);

	return (
		<div className='min-h-screen bg-gray-900 relative'>
			<div className='relative z-10 container mx-auto px-4 py-16'>
				<motion.h1
					className='text-4xl font-bold mb-8 text-emerald-400 text-center'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					Admin Dashboard
				</motion.h1>

				{/* Enhanced Tab Navigation */}
				<div className='flex flex-wrap justify-center mb-8 gap-2'>
					{tabs.map((tab) => (
						<motion.button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
								activeTab === tab.id
									? "bg-emerald-600 text-white shadow-lg"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md"
							}`}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<tab.icon className='mr-2 h-5 w-5' />
							<span className="hidden sm:inline">{tab.label}</span>
							<span className="sm:hidden">{tab.label.split(' ')[0]}</span>
						</motion.button>
					))}
				</div>				{/* Tab Content */}
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3 }}				>					{activeTab === "create" && <CreateProductForm />}
					{activeTab === "products" && <ProductsList />}
					{activeTab === "orders" && <OrderManagement />}
					{activeTab === "categories" && <CategoryManagement />}
					{activeTab === "analytics" && <AnalyticsTab />}
					{activeTab === "performance" && <AdminPerformanceTab />}
					{activeTab === "payments" && <TestPaymentComponent />}
					{activeTab === "vip" && <VipCouponManager />}
					{activeTab === "settings" && <AdminSettings />}
				</motion.div>
			</div>
		</div>
	);
};

export default AdminPage;
