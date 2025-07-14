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
	const navigate = useNavigate();
		const handleAddToCart = (e) => {
		e.stopPropagation(); // Prevent navigation when clicking add to cart
		if (!user) {
			showToast.error("Please login to add products to cart", { id: "login" });
			return;
		} else {
			// add to cart
			addToCart(product);
		}
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
		<div className='flex w-full relative flex-col overflow-hidden rounded-lg border border-gray-700 shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300' onClick={handleProductClick}>
			<div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'>
				<img className='object-cover w-full' src={product.image} alt='product image' />
				<div className='absolute inset-0 bg-black bg-opacity-20' />
				<button
					onClick={handleWishlistToggle}
					className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
						isInWishlist(product._id)
							? "bg-red-600 text-white"
							: "bg-black bg-opacity-50 text-white hover:bg-opacity-70"
					}`}
				>
					<Heart className={`w-4 h-4 ${isInWishlist(product._id) ? "fill-current" : ""}`} />
				</button>
			</div>

			<div className='mt-4 px-5 pb-5'>
				<h5 className='text-xl font-semibold tracking-tight text-white'>{product.name}</h5>
				<div className='mt-2 mb-5 flex items-center justify-between'>
					<p>
						<span className='text-3xl font-bold text-emerald-400'>${product.price}</span>
					</p>
				</div>
				<button
					className='flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium
					 text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 w-full'
					onClick={handleAddToCart}
				>
					<ShoppingCart size={22} className='mr-2' />
					Add to cart
				</button>
			</div>
		</div>
	);
};
export default ProductCard;
