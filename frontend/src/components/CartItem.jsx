import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { validateQuantity, getAvailableStock } from "../lib/stockValidation";
import showToast from "../lib/toast";

const CartItem = ({ item }) => {
	const { removeFromCart, updateQuantityOptimistic } = useCartStore();	const handleQuantityChange = (change) => {
		const newQuantity = item.quantity + change;
		if (newQuantity <= 0) {
			removeFromCart(item.cartId || item._id);
			return;
		}
		
		// Validate the new quantity using shared utility
		const validation = validateQuantity(item, item.selectedSize, newQuantity);
		if (!validation.isValid && change > 0) {
			// Don't update if trying to exceed stock (only show error when increasing)
			showToast.error(validation.message);
			return;
		}
		
		updateQuantityOptimistic(item.cartId || item._id, newQuantity);
	};

	// Use shared utility to get available stock
	const availableStock = getAvailableStock(item, item.selectedSize);
	const isAtMaxStock = availableStock && item.quantity >= availableStock;

	return (
		<div className='rounded-lg border p-4 shadow-sm border-gray-700 bg-gray-800 md:p-6'>
			<div className='space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0'>
				<div className='shrink-0 md:order-1'>
					<img className='h-20 md:h-32 rounded object-cover' src={item.image} />
				</div>
				<label className='sr-only'>Choose quantity:</label>

				<div className='flex items-center justify-between md:order-3 md:justify-end'>
					<div className='flex items-center gap-2'>
						<button
							className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border
							 border-gray-600 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2
							  focus:ring-emerald-500 ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
							onClick={() => handleQuantityChange(-1)}
							disabled={item.quantity <= 1}
						>
							<Minus className='text-gray-300' />
						</button>
						<div className="flex flex-col items-center">
							<p className="text-white">{item.quantity}</p>
							{availableStock && (
								<p className="text-xs text-gray-400">
									{isAtMaxStock ? 'Max stock' : `${availableStock} available`}
								</p>
							)}
						</div>
						<button
							className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border
							 border-gray-600 bg-gray-700 hover:bg-gray-600 focus:outline-none 
						focus:ring-2 focus:ring-emerald-500 ${isAtMaxStock ? 'opacity-50 cursor-not-allowed' : ''}`}
							onClick={() => handleQuantityChange(1)}
							disabled={isAtMaxStock}
						>
							<Plus className='text-gray-300' />
						</button>
					</div>

					<div className='text-end md:order-4 md:w-32'>
						<p className='text-base font-bold text-emerald-400'>${item.price}</p>
					</div>
				</div>
				<div className='w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md'>
					<p className='text-base font-medium text-white hover:text-emerald-400 hover:underline'>
						{item.name}
					</p>
					
					{item.selectedSize && (
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-400">Size:</span>
							<span className="bg-emerald-600 text-white px-2 py-1 rounded text-xs">
								{item.selectedSize}
							</span>
						</div>
					)}
					
					{availableStock && availableStock <= 5 && (
						<div className="flex items-center gap-2">
							<span className="text-xs text-yellow-400">
								⚠️ Only {availableStock} left in stock
							</span>
						</div>
					)}
					
					<p className='text-sm text-gray-400'>{item.description}</p>

					<div className='flex items-center gap-4'>
						<button
							className='inline-flex items-center text-sm font-medium text-red-400
							 hover:text-red-300 hover:underline'
							onClick={() => removeFromCart(item.cartId || item._id)}
						>
							<Trash />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
export default CartItem;
