import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import showToast from '../lib/toast';

const NetworkStatus = () => {
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const [showWarning, setShowWarning] = useState(false);

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			setShowWarning(false);
			showToast.success('Connection restored!');
		};

		const handleOffline = () => {
			setIsOnline(false);
			setShowWarning(true);
			showToast.error('No internet connection');
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Hide warning after 5 seconds if still online
		if (!isOnline) {
			const timer = setTimeout(() => {
				setShowWarning(false);
			}, 5000);
			return () => clearTimeout(timer);
		}

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, [isOnline]);

	if (!showWarning && isOnline) return null;

	return (
		<AnimatePresence>
			{(!isOnline || showWarning) && (
				<motion.div
					initial={{ y: -100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: -100, opacity: 0 }}
					transition={{ duration: 0.5 }}
					className={`fixed top-0 left-0 right-0 z-50 ${
						isOnline ? 'bg-green-600' : 'bg-red-600'
					} text-white text-sm py-3 px-4 shadow-lg`}
				>
					<div className="flex items-center justify-center space-x-2">
						{isOnline ? (
							<>
								<Wifi className="w-4 h-4" />
								<span>Connection restored</span>
							</>
						) : (
							<>
								<WifiOff className="w-4 h-4" />
								<AlertCircle className="w-4 h-4" />
								<span>No internet connection - Some features may not work properly</span>
							</>
						)}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default NetworkStatus;
