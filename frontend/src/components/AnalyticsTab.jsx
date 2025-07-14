import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import LoadingSpinner from "./LoadingSpinner";

const AnalyticsTab = () => {
	const [analyticsData, setAnalyticsData] = useState({
		users: 0,
		products: 0,
		totalSales: 0,
		totalRevenue: 0,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [dailySalesData, setDailySalesData] = useState([]);

	useEffect(() => {
		const fetchAnalyticsData = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const response = await axios.get("/analytics");
				console.log("Analytics response:", response.data);
				
				setAnalyticsData(response.data.analyticsData || {
					users: 0,
					products: 0,
					totalSales: 0,
					totalRevenue: 0,
				});
				
				// Format daily sales data for the chart
				const formattedDailySalesData = (response.data.dailySalesData || []).map(item => ({
					...item,
					name: new Date(item.date).toLocaleDateString('en-US', { 
						month: 'short', 
						day: 'numeric' 
					})
				}));
				
				setDailySalesData(formattedDailySalesData);
			} catch (error) {
				console.error("Error fetching analytics data:", error);
				setError(error.response?.data?.message || "Failed to fetch analytics data");
			} finally {
				setIsLoading(false);
			}
		};

		fetchAnalyticsData();
	}, []);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<LoadingSpinner />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<div className="text-center">
					<p className="text-red-400 text-lg mb-4">Error loading analytics</p>
					<p className="text-gray-400">{error}</p>
					<button 
						onClick={() => window.location.reload()} 
						className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<AnalyticsCard
					title='Total Users'
					value={analyticsData.users?.toLocaleString() || '0'}
					icon={Users}
					color='from-emerald-500 to-teal-700'
				/>
				<AnalyticsCard
					title='Total Products'
					value={analyticsData.products?.toLocaleString() || '0'}
					icon={Package}
					color='from-emerald-500 to-green-700'
				/>
				<AnalyticsCard
					title='Total Sales'
					value={analyticsData.totalSales?.toLocaleString() || '0'}
					icon={ShoppingCart}
					color='from-emerald-500 to-cyan-700'
				/>
				<AnalyticsCard
					title='Total Revenue'
					value={`$${(analyticsData.totalRevenue || 0).toLocaleString()}`}
					icon={DollarSign}
					color='from-emerald-500 to-lime-700'
				/>
			</div>
			
			{dailySalesData.length > 0 ? (
				<motion.div
					className='bg-gray-800/60 rounded-lg p-6 shadow-lg'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.25 }}
				>
					<h3 className="text-xl font-semibold text-white mb-4">Sales Overview (Last 7 Days)</h3>
					<ResponsiveContainer width='100%' height={400}>
						<LineChart data={dailySalesData}>
							<CartesianGrid strokeDasharray='3 3' stroke="#374151" />
							<XAxis dataKey='name' stroke='#D1D5DB' />
							<YAxis yAxisId='left' stroke='#D1D5DB' />
							<YAxis yAxisId='right' orientation='right' stroke='#D1D5DB' />
							<Tooltip 
								contentStyle={{ 
									backgroundColor: '#1F2937', 
									border: '1px solid #374151',
									borderRadius: '8px'
								}}
							/>
							<Legend />
							<Line
								yAxisId='left'
								type='monotone'
								dataKey='sales'
								stroke='#10B981'
								strokeWidth={3}
								activeDot={{ r: 6, fill: '#10B981' }}
								name='Sales'
							/>
							<Line
								yAxisId='right'
								type='monotone'
								dataKey='revenue'
								stroke='#3B82F6'
								strokeWidth={3}
								activeDot={{ r: 6, fill: '#3B82F6' }}
								name='Revenue ($)'
							/>
						</LineChart>
					</ResponsiveContainer>
				</motion.div>
			) : (
				<motion.div
					className='bg-gray-800/60 rounded-lg p-6 shadow-lg text-center'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.25 }}
				>
					<p className="text-gray-400">No sales data available for the chart</p>
				</motion.div>
			)}
		</div>
	);
};
export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon, color }) => (
	<motion.div
		className={`bg-gray-800 rounded-lg p-6 shadow-lg overflow-hidden relative ${color}`}
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<div className='flex justify-between items-center'>
			<div className='z-10'>
				<p className='text-emerald-300 text-sm mb-1 font-semibold'>{title}</p>
				<h3 className='text-white text-3xl font-bold'>{value}</h3>
			</div>
		</div>
		<div className='absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-900 opacity-30' />
		<div className='absolute -bottom-4 -right-4 text-emerald-800 opacity-50'>
			<Icon className='h-32 w-32' />
		</div>
	</motion.div>
);
