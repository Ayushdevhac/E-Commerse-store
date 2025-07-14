import { useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import showToast from "../lib/toast";

const WishlistPage = () => {
	const { user } = useUserStore();
	const { wishlist, loading, getWishlist, removeFromWishlist } = useWishlistStore();
	const { addToCart } = useCartStore();
	const navigate = useNavigate();

	useEffect(() => {
		if (user) {
			getWishlist();
		}
	}, [user, getWishlist]);
	const handleAddToCart = (product) => {
		addToCart(product);
		showToast.success("Added to cart!");
	};

	const handleRemoveFromWishlist = async (productId) => {
		await removeFromWishlist(productId);
	};
	if (!user) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-white mb-4">Please log in to view your wishlist</h2>
					<button
						onClick={() => navigate("/login")}
						className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
					>
						Login
					</button>
				</div>
			</div>
		);
	}

	if (loading) {
		return <LoadingSpinner />;
	}
	if (!wishlist || wishlist.length === 0) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-white mb-4">Your wishlist is empty</h2>
					<p className="text-gray-400 mb-6">Start adding products you love!</p>
					<button
						onClick={() => navigate("/")}
						className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
					>
						Continue Shopping
					</button>
				</div>
			</div>
		);
	}
	return (
		<div className="min-h-screen bg-gray-900 py-8 px-4 max-w-6xl mx-auto">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-white mb-2">My Wishlist</h1>
				<p className="text-gray-400">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} in your wishlist</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{wishlist.map((product) => (
					<motion.div
						key={product._id}
						layout
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg"
					>
						<div className="relative">
							<img
								src={product.image}
								alt={product.name}
								className="w-full h-48 object-cover cursor-pointer"
								onClick={() => navigate(`/product/${product._id}`)}
							/>
							<button
								onClick={() => handleRemoveFromWishlist(product._id)}
								className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>

						<div className="p-4">
							<h3 
								className="text-lg font-semibold text-white mb-2 cursor-pointer hover:text-emerald-400 transition-colors"
								onClick={() => navigate(`/product/${product._id}`)}
							>
								{product.name}
							</h3>
							<p className="text-emerald-400 text-xl font-bold mb-4">${product.price}</p>

							<button
								onClick={() => handleAddToCart(product)}
								className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
							>
								<ShoppingCart className="w-4 h-4" />
								Add to Cart
							</button>
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
};

export default WishlistPage;
