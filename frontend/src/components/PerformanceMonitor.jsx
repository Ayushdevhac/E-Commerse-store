import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, Clock, AlertTriangle } from 'lucide-react';
import { useUserStore } from '../stores/useUserStore';

const PerformanceMonitor = () => {
	const { user } = useUserStore();
	const [isExpanded, setIsExpanded] = useState(false);	const [metrics, setMetrics] = useState({
		loadTime: 0,
		connectionType: 'unknown',
		isOnline: navigator.onLine,
		apiLatency: 0,
		memoryUsage: 0,
		renderTime: 0,
		bundleSize: 0
	});
	const [showAlert, setShowAlert] = useState(false);

	useEffect(() => {		// Measure page load performance
		const measurePerformance = () => {
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

		// Measure API latency
		const measureApiLatency = async () => {
			try {
				const startTime = Date.now();
				await fetch('/api/health');
				const endTime = Date.now();
				const latency = endTime - startTime;
				
				setMetrics(prev => ({ ...prev, apiLatency: latency }));
				
				// Show alert for slow performance
				if (latency > 2000) {
					setShowAlert(true);
					setTimeout(() => setShowAlert(false), 5000);
				}
			} catch (error) {
				console.log('API latency measurement failed');
			}
		};

		measurePerformance();
		measureApiLatency();

		// Monitor connection changes
		const handleOnline = () => setMetrics(prev => ({ ...prev, isOnline: true }));
		const handleOffline = () => setMetrics(prev => ({ ...prev, isOnline: false }));
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Admin keyboard shortcut: Ctrl+Shift+P to toggle performance monitor
		const handleKeyDown = (e) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'P') {
				e.preventDefault();
				setIsExpanded(prev => !prev);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, []);
	// Only show for admin users
	const isAdmin = user && user.role === 'admin';
	
	// Don't render if user is not admin
	if (!isAdmin) return null;

	// Only show in development or if there's a performance issue
	const shouldShow = process.env.NODE_ENV === 'development' || showAlert || !metrics.isOnline;

	if (!shouldShow) return null;

	const getPerformanceColor = (metric, thresholds) => {
		if (metric <= thresholds.good) return 'text-green-400';
		if (metric <= thresholds.ok) return 'text-yellow-400';
		return 'text-red-400';
	};
	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className={`fixed top-16 right-4 bg-gray-800 border border-gray-700 rounded-lg text-xs z-30 shadow-lg ${
				isExpanded ? 'p-4 w-80' : 'p-3'
			}`}
		>			{/* Header with toggle */}
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center space-x-2">
					<Activity className="w-3 h-3 text-emerald-400" />
					<span className="text-gray-300 font-medium">Admin Performance</span>
				</div>
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="text-gray-400 hover:text-gray-300 text-xs"
					title="Toggle performance details (Ctrl+Shift+P)"
				>
					{isExpanded ? 'Minimize' : 'Expand'}
				</button>
			</div>

			{/* Compact view */}
			{!isExpanded && (
				<div className="flex items-center space-x-3">
					{metrics.loadTime > 0 && (
						<div className="flex items-center space-x-1">
							<Clock className="w-3 h-3" />
							<span className={getPerformanceColor(metrics.loadTime, { good: 1000, ok: 3000 })}>
								{(metrics.loadTime / 1000).toFixed(1)}s
							</span>
						</div>
					)}

					{metrics.apiLatency > 0 && (
						<div className="flex items-center space-x-1">
							<span className="text-gray-400">API:</span>
							<span className={getPerformanceColor(metrics.apiLatency, { good: 500, ok: 1500 })}>
								{metrics.apiLatency}ms
							</span>
						</div>
					)}

					<div className="flex items-center space-x-1">
						<Wifi className={`w-3 h-3 ${metrics.isOnline ? 'text-green-400' : 'text-red-400'}`} />
						<span className={metrics.isOnline ? 'text-green-400' : 'text-red-400'}>
							{metrics.connectionType}
						</span>
					</div>

					{showAlert && (
						<div className="flex items-center space-x-1 text-red-400">
							<AlertTriangle className="w-3 h-3" />
							<span>Slow</span>
						</div>
					)}
				</div>
			)}

			{/* Expanded detailed view */}
			{isExpanded && (
				<div className="space-y-3">
					{/* Performance Metrics Grid */}
					<div className="grid grid-cols-2 gap-3">
						<div className="bg-gray-700 rounded p-2">
							<div className="text-gray-400 text-xs mb-1">Load Time</div>
							<div className={`font-semibold ${getPerformanceColor(metrics.loadTime, { good: 1000, ok: 3000 })}`}>
								{metrics.loadTime > 0 ? `${(metrics.loadTime / 1000).toFixed(2)}s` : 'N/A'}
							</div>
						</div>

						<div className="bg-gray-700 rounded p-2">
							<div className="text-gray-400 text-xs mb-1">API Latency</div>
							<div className={`font-semibold ${getPerformanceColor(metrics.apiLatency, { good: 500, ok: 1500 })}`}>
								{metrics.apiLatency > 0 ? `${metrics.apiLatency}ms` : 'N/A'}
							</div>
						</div>

						<div className="bg-gray-700 rounded p-2">
							<div className="text-gray-400 text-xs mb-1">Memory Usage</div>
							<div className={`font-semibold ${getPerformanceColor(metrics.memoryUsage, { good: 50, ok: 100 })}`}>
								{metrics.memoryUsage > 0 ? `${metrics.memoryUsage.toFixed(1)}MB` : 'N/A'}
							</div>
						</div>

						<div className="bg-gray-700 rounded p-2">
							<div className="text-gray-400 text-xs mb-1">Render Time</div>
							<div className={`font-semibold ${getPerformanceColor(metrics.renderTime, { good: 1000, ok: 2500 })}`}>
								{metrics.renderTime > 0 ? `${metrics.renderTime.toFixed(0)}ms` : 'N/A'}
							</div>
						</div>
					</div>

					{/* Connection Status */}
					<div className="bg-gray-700 rounded p-2">
						<div className="text-gray-400 text-xs mb-1">Connection</div>
						<div className="flex items-center space-x-2">
							<Wifi className={`w-3 h-3 ${metrics.isOnline ? 'text-green-400' : 'text-red-400'}`} />
							<span className={`font-semibold ${metrics.isOnline ? 'text-green-400' : 'text-red-400'}`}>
								{metrics.isOnline ? 'Online' : 'Offline'}
							</span>
							<span className="text-gray-400">({metrics.connectionType})</span>
						</div>
					</div>

					{/* Performance Alert */}
					{showAlert && (
						<div className="bg-red-900/20 border border-red-500/30 rounded p-2">
							<div className="flex items-center space-x-2 text-red-400">
								<AlertTriangle className="w-3 h-3" />
								<span className="font-semibold">Performance Alert</span>
							</div>
							<div className="text-red-300 text-xs mt-1">
								Slow API response detected ({metrics.apiLatency}ms)
							</div>
						</div>
					)}

					{/* Quick Actions */}
					<div className="flex space-x-2 text-xs">
						<button
							onClick={() => window.location.reload()}
							className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
						>
							Refresh
						</button>
						<button
							onClick={() => {
								if (window.performance && window.performance.clearMarks) {
									window.performance.clearMarks();
									window.performance.clearMeasures();
								}
								window.location.reload();
							}}
							className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
						>
							Clear Cache
						</button>
					</div>
				</div>
			)}
		</motion.div>
	);
};

export default PerformanceMonitor;
