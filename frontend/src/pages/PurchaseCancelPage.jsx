import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const PurchaseCancelPage = () => {
	const [sessionId, setSessionId] = useState(null);

	useEffect(() => {
		// Safely get session ID from URL if available
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const id = urlParams.get("session_id");
			setSessionId(id);
		}
	}, []);

	const handleContactSupport = () => {
		// You can replace this with your actual support system
		if (typeof window !== 'undefined') {
			const subject = sessionId 
				? `Purchase Issue - Session ID: ${sessionId}` 
				: 'Purchase Issue';
			window.open(`mailto:support@yourstore.com?subject=${encodeURIComponent(subject)}`, '_blank');
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
			<motion.div
				initial={{ opacity: 0, y: 20, scale: 0.9 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.5 }}
				className='max-w-md w-full bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-gray-700/50'
			>
				<div className='p-6 sm:p-8'>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
						className='flex justify-center'
					>
						<div className='relative'>
							<XCircle className='text-red-500 w-16 h-16 mb-4' />
							<motion.div
								className='absolute inset-0 rounded-full bg-red-500/20'
								initial={{ scale: 1, opacity: 0.7 }}
								animate={{ scale: 1.5, opacity: 0 }}
								transition={{ duration: 2, repeat: Infinity }}
							/>
						</div>
					</motion.div>
					
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className='text-2xl sm:text-3xl font-bold text-center text-red-500 mb-2'
					>
						Purchase Cancelled
					</motion.h1>
					
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						className='text-gray-300 text-center mb-6'
					>
						Your order has been cancelled. No charges have been made to your account.
					</motion.p>
					
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className='bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-600/30'
					>
						<p className='text-sm text-gray-400 text-center mb-3'>
							If you encountered any issues during checkout, we&apos;re here to help!
						</p>
						<div className='flex items-center justify-center gap-2 text-emerald-400'>
							<MessageCircle className='w-4 h-4' />
							<span className='text-sm font-medium'>24/7 Customer Support Available</span>
						</div>
					</motion.div>
					
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6 }}
						className='space-y-3'
					>
						<Link
							to={"/cart"}
							className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center group'
						>
							<RefreshCw className='mr-2 w-5 h-5 group-hover:rotate-180 transition-transform duration-500' />
							Try Again
						</Link>
						
						<Link
							to={"/"}
							className='w-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center group'
						>
							<ArrowLeft className='mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300' />
							Return to Shop
						</Link>						<button 
							onClick={handleContactSupport}
							className='w-full border border-gray-600 hover:border-emerald-400 text-gray-400 hover:text-emerald-400 font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center group'
						>
							<MessageCircle className='mr-2 w-5 h-5' />
							Contact Support
						</button>
					</motion.div>
				</div>
			</motion.div>
		</div>
	);
};

export default PurchaseCancelPage;
