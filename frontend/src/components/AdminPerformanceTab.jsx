import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
	Activity, 
	Wifi, 
	Clock, 
	AlertTriangle, 
	MemoryStick, 
	Zap, 
	Database,
	RefreshCw,
	Monitor
} from 'lucide-react';
import axios from '../lib/axios';

const AdminPerformanceTab = () => {
	const [metrics, setMetrics] = useState({
		loadTime: 0,
		connectionType: 'unknown',
		isOnline: navigator.onLine,		apiLatency: 0,
		memoryUsage: 0,
		renderTime: 0,
		bundleSize: 0,
		serverMetrics: null,
		businessMetrics: null
	});
	const [isLoading, setIsLoading] = useState(false);
	const [lastUpdated, setLastUpdated] = useState(null);

	useEffect(() => {
		measurePerformance();
		measureApiLatency();
		fetchServerMetrics();
		
		// Set up auto-refresh every 30 seconds
		const interval = setInterval(() => {
			measureApiLatency();
			fetchServerMetrics();
		}, 30000);

		return () => clearInterval(interval);
	}, []);

	const measurePerformance = () => {
		// Measure page load performance
		if (window.performance && window.performance.timing) {
			const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
			setMetrics(prev => ({ ...prev, loadTime }));
		}

		// Get connection info
		if ('connection' in navigator) {
			const connection = navigator.connection;
			setMetrics(prev => ({ 
				...prev, 
				connectionType: connection.effectiveType || 'unknown'
			}));
		}

		// Measure memory usage (Chrome only)
		if (window.performance && window.performance.memory) {
			const memoryUsage = window.performance.memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
			setMetrics(prev => ({ ...prev, memoryUsage }));
		}

		// Get render performance
		if (window.performance && window.performance.getEntriesByType) {
			const paintEntries = window.performance.getEntriesByType('paint');
			const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
			if (firstContentfulPaint) {
				setMetrics(prev => ({ ...prev, renderTime: firstContentfulPaint.startTime }));
			}
		}
	};
	const measureApiLatency = async () => {
		try {
			const startTime = Date.now();
			const response = await axios.get('/health');
			const endTime = Date.now();
			const latency = endTime - startTime;
			
			setMetrics(prev => ({ 
				...prev, 
				apiLatency: latency,
				serverMetrics: response.data
			}));
			setLastUpdated(new Date());
		} catch (error) {
			console.error('API latency measurement failed:', error);
		}
	};
	const fetchServerMetrics = async () => {
		try {
			const analyticsResponse = await axios.get('/analytics/overview');
			// Server metrics are now fetched via the health endpoint in measureApiLatency
			// Here we can get additional business metrics
			if (analyticsResponse.data) {
				setMetrics(prev => ({ 
					...prev, 
					businessMetrics: {
						totalUsers: analyticsResponse.data.users || 0,
						totalProducts: analyticsResponse.data.totalProducts || 0,
						totalRevenue: analyticsResponse.data.totalRevenue || 0
					}
				}));
			}
		} catch (error) {
			console.error('Failed to fetch business metrics:', error);
		}
	};

	const refreshMetrics = async () => {
		setIsLoading(true);
		await Promise.all([
			measurePerformance(),
			measureApiLatency(),
			fetchServerMetrics()
		]);
		setIsLoading(false);
	};

	const getPerformanceColor = (metric, thresholds) => {
		if (metric <= thresholds.good) return 'text-green-400';
		if (metric <= thresholds.ok) return 'text-yellow-400';
		return 'text-red-400';
	};

	const getPerformanceStatus = (metric, thresholds) => {
		if (metric <= thresholds.good) return 'Excellent';
		if (metric <= thresholds.ok) return 'Good';
		return 'Poor';
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<Activity className="w-6 h-6 text-emerald-400" />
					<h2 className="text-2xl font-bold text-white">Performance Dashboard</h2>
				</div>
				<div className="flex items-center space-x-3">
					{lastUpdated && (
						<span className="text-sm text-gray-400">
							Last updated: {lastUpdated.toLocaleTimeString()}
						</span>
					)}
					<button
						onClick={refreshMetrics}
						disabled={isLoading}
						className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
					>
						<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
						<span>Refresh</span>
					</button>
				</div>
			</div>

			{/* Performance Metrics Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Load Time */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-gray-800 border border-gray-700 rounded-lg p-4"
				>
					<div className="flex items-center justify-between mb-2">
						<Clock className="w-5 h-5 text-blue-400" />
						<span className={`text-xs font-semibold ${getPerformanceColor(metrics.loadTime, { good: 1000, ok: 3000 })}`}>
							{getPerformanceStatus(metrics.loadTime, { good: 1000, ok: 3000 })}
						</span>
					</div>
					<div className="text-2xl font-bold text-white mb-1">
						{metrics.loadTime > 0 ? `${(metrics.loadTime / 1000).toFixed(2)}s` : 'N/A'}
					</div>
					<div className="text-sm text-gray-400">Page Load Time</div>
				</motion.div>

				{/* API Latency */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-gray-800 border border-gray-700 rounded-lg p-4"
				>
					<div className="flex items-center justify-between mb-2">
						<Zap className="w-5 h-5 text-yellow-400" />
						<span className={`text-xs font-semibold ${getPerformanceColor(metrics.apiLatency, { good: 500, ok: 1500 })}`}>
							{getPerformanceStatus(metrics.apiLatency, { good: 500, ok: 1500 })}
						</span>
					</div>
					<div className="text-2xl font-bold text-white mb-1">
						{metrics.apiLatency > 0 ? `${metrics.apiLatency}ms` : 'N/A'}
					</div>
					<div className="text-sm text-gray-400">API Response Time</div>
				</motion.div>

				{/* Memory Usage */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-gray-800 border border-gray-700 rounded-lg p-4"
				>
					<div className="flex items-center justify-between mb-2">
						<MemoryStick className="w-5 h-5 text-purple-400" />
						<span className={`text-xs font-semibold ${getPerformanceColor(metrics.memoryUsage, { good: 50, ok: 100 })}`}>
							{getPerformanceStatus(metrics.memoryUsage, { good: 50, ok: 100 })}
						</span>
					</div>
					<div className="text-2xl font-bold text-white mb-1">
						{metrics.memoryUsage > 0 ? `${metrics.memoryUsage.toFixed(1)}MB` : 'N/A'}
					</div>
					<div className="text-sm text-gray-400">Memory Usage</div>
				</motion.div>

				{/* Render Time */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="bg-gray-800 border border-gray-700 rounded-lg p-4"
				>
					<div className="flex items-center justify-between mb-2">
						<Monitor className="w-5 h-5 text-green-400" />
						<span className={`text-xs font-semibold ${getPerformanceColor(metrics.renderTime, { good: 1000, ok: 2500 })}`}>
							{getPerformanceStatus(metrics.renderTime, { good: 1000, ok: 2500 })}
						</span>
					</div>
					<div className="text-2xl font-bold text-white mb-1">
						{metrics.renderTime > 0 ? `${metrics.renderTime.toFixed(0)}ms` : 'N/A'}
					</div>
					<div className="text-sm text-gray-400">First Contentful Paint</div>
				</motion.div>
			</div>

			{/* Connection Status */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
				className="bg-gray-800 border border-gray-700 rounded-lg p-4"
			>
				<h3 className="text-lg font-semibold text-white mb-3 flex items-center">
					<Wifi className="w-5 h-5 text-emerald-400 mr-2" />
					Connection Status
				</h3>
				<div className="flex items-center space-x-4">
					<div className={`flex items-center space-x-2 ${metrics.isOnline ? 'text-green-400' : 'text-red-400'}`}>
						<div className={`w-3 h-3 rounded-full ${metrics.isOnline ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
						<span className="font-semibold">{metrics.isOnline ? 'Online' : 'Offline'}</span>
					</div>
					<div className="text-gray-400">
						Connection Type: <span className="text-white">{metrics.connectionType}</span>
					</div>
				</div>
			</motion.div>

			{/* Performance Recommendations */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
				className="bg-gray-800 border border-gray-700 rounded-lg p-4"
			>
				<h3 className="text-lg font-semibold text-white mb-3 flex items-center">
					<AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
					Performance Recommendations
				</h3>
				<div className="space-y-2">
					{metrics.loadTime > 3000 && (
						<div className="text-yellow-400 text-sm">
							• Page load time is slow. Consider optimizing images and reducing bundle size.
						</div>
					)}
					{metrics.apiLatency > 1500 && (
						<div className="text-yellow-400 text-sm">
							• API response time is slow. Check server performance and database queries.
						</div>
					)}
					{metrics.memoryUsage > 100 && (
						<div className="text-yellow-400 text-sm">
							• High memory usage detected. Check for memory leaks in components.
						</div>
					)}
					{metrics.loadTime <= 1000 && metrics.apiLatency <= 500 && metrics.memoryUsage <= 50 && (
						<div className="text-green-400 text-sm">
							✓ All performance metrics are within optimal ranges!
						</div>
					)}
				</div>
			</motion.div>			{/* Server Health & Performance */}
			{metrics.serverMetrics && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="bg-gray-800 border border-gray-700 rounded-lg p-4"
				>
					<h3 className="text-lg font-semibold text-white mb-3 flex items-center">
						<Database className="w-5 h-5 text-blue-400 mr-2" />
						Server Health
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-green-400">{metrics.serverMetrics.status}</div>
							<div className="text-sm text-gray-400">Status</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-400">{Math.round(metrics.serverMetrics.uptime / 3600)}h</div>
							<div className="text-sm text-gray-400">Uptime</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-purple-400">{metrics.serverMetrics.memory?.used || 0}MB</div>
							<div className="text-sm text-gray-400">Memory Used</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-yellow-400">{metrics.serverMetrics.environment}</div>
							<div className="text-sm text-gray-400">Environment</div>
						</div>
					</div>
				</motion.div>
			)}

			{/* Business Metrics */}
			{metrics.businessMetrics && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.7 }}
					className="bg-gray-800 border border-gray-700 rounded-lg p-4"
				>
					<h3 className="text-lg font-semibold text-white mb-3 flex items-center">
						<Activity className="w-5 h-5 text-emerald-400 mr-2" />
						Business Overview
					</h3>
					<div className="grid grid-cols-3 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-emerald-400">{metrics.businessMetrics.totalUsers}</div>
							<div className="text-sm text-gray-400">Total Users</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-400">{metrics.businessMetrics.totalProducts}</div>
							<div className="text-sm text-gray-400">Total Products</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-400">${metrics.businessMetrics.totalRevenue}</div>
							<div className="text-sm text-gray-400">Total Revenue</div>
						</div>
					</div>
				</motion.div>
			)}
		</div>
	);
};

export default AdminPerformanceTab;
