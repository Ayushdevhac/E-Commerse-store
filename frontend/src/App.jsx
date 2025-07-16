import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import WishlistPage from "./pages/WishlistPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import UserProfilePage from "./pages/UserProfilePage";
import OrderDetailPage from "./pages/OrderDetailPage";
import AddressTestPage from "./pages/AddressTestPage";
import ReviewsPage from "./pages/ReviewsPage";

import Navbar from "./components/Navbar";
import NetworkStatus from "./components/NetworkStatus";
import FeedbackWidget from "./components/FeedbackWidget";
import PerformanceMonitor from "./components/PerformanceMonitor";
import { Toaster } from "react-hot-toast";
import { useUserStore } from "./stores/useUserStore";
import { useEffect } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import CartPage from "./pages/CartPage";
import { useCartStore } from "./stores/useCartStore";
import { useWishlistStore } from "./stores/useWishlistStore";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";

function App() {
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { getCartItems } = useCartStore();
	const { getWishlist } = useWishlistStore();

	useEffect(() => {
		checkAuth().catch(error => {
			console.error('Auth check failed:', error);
		});
	}, [checkAuth]);

	useEffect(() => {
		if (!user) return;

		Promise.all([
			getCartItems().catch(error => console.error('Failed to load cart:', error)),
			getWishlist().catch(error => console.error('Failed to load wishlist:', error))
		]);
	}, [getCartItems, getWishlist, user]);

	if (checkingAuth) {
		return <LoadingSpinner />;
	}
	return (		<div className='min-h-screen bg-gray-900 text-white relative overflow-x-hidden'>
			{/* Network Status Component */}
			<NetworkStatus />
			
			{/* Performance Monitor */}
			<PerformanceMonitor />
			
			{/* Background gradient - fixed to cover full page */}
			<div className='fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0'>
				<div className='absolute inset-0 bg-gray-900'>
					<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.3)_0%,rgba(10,80,60,0.2)_45%,rgba(0,0,0,0.1)_100%)]' />
				</div>
			</div>

			<div className='relative z-10'>
				<Navbar />
				<div className='pt-16 sm:pt-20'>
					<Routes>
					<Route path='/' element={<HomePage />} />
					<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
					<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
					<Route
						path='/secret-dashboard'
						element={user?.role === "admin" ? <AdminPage /> : <Navigate to='/login' />}
					/>
					<Route path='/category/:category' element={<CategoryPage />} />
					<Route path='/product/:id' element={<ProductDetailPage />} />
					<Route path='/wishlist' element={user ? <WishlistPage /> : <Navigate to='/login' />} />
					<Route path='/reviews' element={user ? <ReviewsPage /> : <Navigate to='/login' />} />
					<Route path='/order-history' element={user ? <OrderHistoryPage /> : <Navigate to='/login' />} />
					<Route path='/order/:id' element={user ? <OrderDetailPage /> : <Navigate to='/login' />} />
					<Route path='/profile' element={user ? <UserProfilePage /> : <Navigate to='/login' />} />
					<Route path='/cart' element={user ? <CartPage /> : <Navigate to='/login' />} />
					<Route
						path='/purchase-success'
						element={<PurchaseSuccessPage />}
					/>
					<Route path='/purchase-cancel' element={user ? <PurchaseCancelPage /> : <Navigate to='/login' />} />
					<Route path='/address-test' element={<AddressTestPage />} />
				</Routes>
				</div>
			</div>
			
			{/* Feedback Widget - only show for logged in users */}
			{user && <FeedbackWidget />}
			
			<Toaster
				position="top-right"
				toastOptions={{
					className: 'text-sm',
					duration: 4000,
					style: {
						background: '#374151',
						color: '#fff',
					},
				}}
			/>
		</div>
	);
}

export default App;
