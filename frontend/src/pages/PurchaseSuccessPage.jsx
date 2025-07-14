import { ArrowRight, CheckCircle, HandHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";
import { motion } from "framer-motion";
// Confetti is used for displaying a celebratory animation when the purchase is successful.
import Confetti from "react-confetti";

const PurchaseSuccessPage = () => {
	const [isProcessing, setIsProcessing] = useState(true);
	const { clearCart } = useCartStore();
	const { user, checkAuth } = useUserStore();
	const [error, setError] = useState(null);
	const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
	useEffect(() => {
		// Set initial window size - check if window is available
		const updateWindowSize = () => {
			if (typeof window !== 'undefined') {
				setWindowSize({
					width: window.innerWidth,
					height: window.innerHeight
				});
			}
		};

		updateWindowSize();
		
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateWindowSize);
			return () => window.removeEventListener('resize', updateWindowSize);
		}
	}, []);	useEffect(() => {
		// First, try to check authentication status
		const checkAuthAndProcess = async () => {
			// If user is not authenticated, try to restore it
			if (!user) {
				try {
					await checkAuth();
				} catch (error) {
					console.log('Auth restoration failed:', error);
				}
			}

			// Now proceed with checkout success processing
			const sessionId = typeof window !== 'undefined' 
				? new URLSearchParams(window.location.search).get("session_id")
				: null;

			if (sessionId) {
				await handleCheckoutSuccess(sessionId);
			} else {
				setIsProcessing(false);
				console.log("No session ID found, showing generic success message");
			}
		};

		const handleCheckoutSuccess = async (sessionId) => {
			try {
				console.log('Making request to:', '/payments/checkout-success');
				console.log('Session ID:', sessionId);
				console.log('User logged in:', !!user);
				
				const response = await axios.post("/payments/checkout-success", {
					sessionId,
				});
				
				console.log('Success response:', response.data);
				
				// Only clear cart if user is logged in
				if (user) {
					clearCart();
				}
			} catch (error) {
				console.error("Checkout success error:", error);
				console.error("Error response:", error.response?.data);
				console.error("Error status:", error.response?.status);
				console.error("Error message:", error.message);
				
				if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
					setError("Cannot connect to server. Your payment was processed successfully, but we couldn't update your account.");
				} else if (error.response?.status === 404) {
					setError("Session not found. Your payment may have already been processed.");
				} else if (error.response?.status === 400) {
					setError(error.response?.data?.message || "Invalid payment session.");
				} else {
					// Don't show error for other cases, as the payment was likely successful
					console.log("Payment endpoint error, but showing success since user reached this page from Stripe");
				}
			} finally {
				setIsProcessing(false);
			}
		};

		if (typeof window !== 'undefined') {
			checkAuthAndProcess();
		} else {
			setIsProcessing(false);
			setError("Unable to access URL parameters");
		}
	}, [clearCart, user, checkAuth]);
	if (isProcessing) {
		return (
			<div className='h-screen flex items-center justify-center px-4'>
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					className='max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center'
				>
					<div className='animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-4'></div>
					<p className='text-white text-lg'>Processing your order...</p>
				</motion.div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='h-screen flex items-center justify-center px-4'>
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					className='max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center'
				>
					<div className='text-red-500 text-6xl mb-4'>⚠️</div>
					<h2 className='text-red-500 text-xl font-bold mb-4'>Error</h2>
					<p className='text-gray-300 mb-6'>{error}</p>
					<Link
						to={"/"}
						className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 inline-block'
					>
						Return to Home
					</Link>
				</motion.div>
			</div>
		);
	}
	return (		<div className='h-screen flex items-center justify-center px-4'>
			{typeof window !== 'undefined' && windowSize.width > 0 && windowSize.height > 0 && (
				<Confetti
					width={windowSize.width}
					height={windowSize.height}
					gravity={0.1}
					style={{ zIndex: 99 }}
					numberOfPieces={700}
					recycle={false}
				/>
			)}

			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5 }}
				className='max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10'
			>
				<div className='p-6 sm:p-8'>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: "spring" }}
						className='flex justify-center'
					>
						<CheckCircle className='text-emerald-400 w-16 h-16 mb-4' />
					</motion.div>
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className='text-2xl sm:text-3xl font-bold text-center text-emerald-400 mb-2'
					>
						Purchase Successful!
					</motion.h1>					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						className='text-gray-300 text-center mb-2'
					>
						Thank you for your order. {"We're"} processing it now.
					</motion.p>
					
					{user && (
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.45 }}
							className='text-gray-400 text-center text-sm mb-2'
						>
							Welcome back, {user.name}!
						</motion.p>
					)}
					
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
						className='text-emerald-400 text-center text-sm mb-6'
					>
						Check your email for order details and updates.
					</motion.p>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6 }}
						className='bg-gray-700 rounded-lg p-4 mb-6'
					>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm text-gray-400'>Order number</span>
							<span className='text-sm font-semibold text-emerald-400'>#12345</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-gray-400'>Estimated delivery</span>
							<span className='text-sm font-semibold text-emerald-400'>3-5 business days</span>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7 }}
						className='space-y-4'
					>
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4
             rounded-lg transition duration-300 flex items-center justify-center'
						>
							<HandHeart className='mr-2' size={18} />
							Thanks for trusting us!
						</motion.button>
						<Link
							to={"/"}
							className='w-full bg-gray-700 hover:bg-gray-600 text-emerald-400 font-bold py-2 px-4 
            rounded-lg transition duration-300 flex items-center justify-center'
						>
							Continue Shopping
							<ArrowRight className='ml-2' size={18} />
						</Link>
					</motion.div>
				</div>
			</motion.div>
		</div>
	);
};
export default PurchaseSuccessPage;
