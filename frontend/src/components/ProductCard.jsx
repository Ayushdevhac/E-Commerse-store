import showToast from "../lib/toast";
import { ShoppingCart, Heart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
	const { user } = useUserStore();
	const { addToCart } = useCartStore();
	const { toggleWishlist: toggleWishlistAction, isInWishlist } = useWishlistStore();
	const navigate = useNavigate();const handleAddToCart = (e) => {
		e.stopPropagation(); // Prevent navigation when clicking add to cart
		if (!user) {
			showToast.error("Please login to add products to cart", { id: "login" });
			return;
		}
		
		// If product has sizes, redirect to product detail page
		if (product.sizes && product.sizes.length > 0) {
			showToast.error("Please select a size on the product page");
			navigate(`/product/${product._id}`);
			return;
		}
		
		// Add to cart for products without sizes
		addToCart(product);
	};

	const handleWishlistToggle = async (e) => {		e.stopPropagation(); // Prevent navigation when clicking wishlist
		if (!user) {
			showToast.error("Please login to add to wishlist");
			return;
		}
		await toggleWishlistAction(product._id);
	};

	const handleProductClick = () => {
		navigate(`/product/${product._id}`);
	};	return (
		<div className='flex w-full relative flex-col overflow-hidden rounded-lg border border-gray-700 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gray-800' onClick={handleProductClick}>
			<div className='relative mx-3 mt-3 flex h-48 sm:h-60 overflow-hidden rounded-xl'>
				<img className='object-cover w-full transition-transform duration-300 hover:scale-110' src={product.image} alt='product image' />
				<div className='absolute inset-0 bg-black bg-opacity-20' />
				<button
					onClick={handleWishlistToggle}
					className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
						isInWishlist(product._id)
							? "bg-red-600 text-white scale-110"
							: "bg-black bg-opacity-50 text-white hover:bg-opacity-70 hover:scale-110"
					}`}
				>
					<Heart className={`w-4 h-4 ${isInWishlist(product._id) ? "fill-current" : ""}`} />
				</button>
			</div>

			<div className='mt-4 px-3 sm:px-5 pb-3 sm:pb-5 flex-1 flex flex-col'>
				<h5 className='text-lg sm:text-xl font-semibold tracking-tight text-white line-clamp-2 mb-2'>{product.name}</h5>				{product.description && (
					<p className='text-sm text-gray-400 line-clamp-2 mb-3 flex-1'>
						{product.description}
					</p>
				)}				{/* Available Sizes */}
				{product.sizes && product.sizes.length > 0 && (
					<div className="mb-3">
						<p className="text-xs text-gray-400 mb-1">Available sizes:</p>
						<div className="flex flex-wrap gap-1">
							{product.sizes.slice(0, 5).map((size) => (
								<span 
									key={size} 
									className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
								>
									{size}
								</span>
							))}
							{product.sizes.length > 5 && (
								<span className="text-xs text-gray-400">
									+{product.sizes.length - 5} more
								</span>
							)}
						</div>
						<p className="text-xs text-emerald-400 mt-1">Click to select size</p>
					</div>
				)}
				
				<div className='mt-auto'>
					<div className='mb-3 sm:mb-4 flex items-center justify-between'>
						<p>
							<span className='text-2xl sm:text-3xl font-bold text-emerald-400'>${product.price}</span>
						</p>
						{product.category && (
							<span className='bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs'>
								{product.category}
							</span>
						)}
					</div>
					<button
						className='flex items-center justify-center rounded-lg bg-emerald-600 px-3 sm:px-5 py-2 sm:py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 w-full transition-all duration-200 transform hover:scale-105 active:scale-95'
						onClick={handleAddToCart}
					>
						<ShoppingCart size={18} className='mr-2' />
						<span className='hidden sm:inline'>Add to cart</span>
						<span className='sm:hidden'>Add</span>
					</button>
				</div>
			</div>
		</div>
	);
};
export default ProductCard;
