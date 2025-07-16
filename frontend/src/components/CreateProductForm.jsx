import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader, X, Plus } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import useCategoryStore from "../stores/useCategoryStore";

const CreateProductForm = () => {
	const [newProduct, setNewProduct] = useState({
		name: "",
		description: "",
		price: "",
		category: "",
		image: "",
		sizes: [],
		stock: {}
	});
	const [showSizes, setShowSizes] = useState(false);
	const { createProduct, loading } = useProductStore();
	const { categories, fetchCategories, loading: categoriesLoading } = useCategoryStore();

	// Common sizes for different categories
	const sizeOptions = {
		clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
		shoes: ['6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
		pants: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50']
	};

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	// Filter only active categories for product creation
	const activeCategories = categories.filter(category => category.isActive);

	// Check if category typically needs sizes
	const categoryNeedsSizes = (category) => {
		const sizeCats = ['clothing', 'shirts', 't-shirts', 'pants', 'jeans', 'jackets', 'shoes', 'sneakers', 'boots'];
		return sizeCats.some(cat => category.toLowerCase().includes(cat));
	};

	useEffect(() => {
		setShowSizes(categoryNeedsSizes(newProduct.category));
	}, [newProduct.category]);	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			// Convert price to number before sending
			const productData = {
				...newProduct,
				price: parseFloat(newProduct.price)
			};
			
			// Only include sizes and stock if sizes are selected
			if (newProduct.sizes.length > 0) {
				productData.sizes = newProduct.sizes;
				productData.stock = newProduct.stock;
			} else {
				// Remove sizes and stock if not needed
				delete productData.sizes;
				delete productData.stock;
			}
			
			await createProduct(productData);
			
			setNewProduct({ 
				name: "", 
				description: "", 
				price: "", 
				category: "", 
				image: "",
				sizes: [],
				stock: {}
			});
			setShowSizes(false);
		} catch(error) {
			console.log("error creating a product");
			console.error(error);
		}
	};

	const handleSizeToggle = (size) => {
		const updatedSizes = newProduct.sizes.includes(size)
			? newProduct.sizes.filter(s => s !== size)
			: [...newProduct.sizes, size];
		
		const updatedStock = { ...newProduct.stock };
		
		if (updatedSizes.includes(size) && !updatedStock[size]) {
			updatedStock[size] = 10; // Default stock
		} else if (!updatedSizes.includes(size)) {
			delete updatedStock[size];
		}
		
		setNewProduct({ 
			...newProduct, 
			sizes: updatedSizes,
			stock: updatedStock
		});
	};

	const handleStockChange = (size, stock) => {
		setNewProduct({
			...newProduct,
			stock: {
				...newProduct.stock,
				[size]: Math.max(0, parseInt(stock) || 0)
			}
		});
	};

	const getSizeOptionsForCategory = () => {
		const category = newProduct.category.toLowerCase();
		if (category.includes('shoe') || category.includes('sneaker') || category.includes('boot')) {
			return sizeOptions.shoes;
		} else if (category.includes('pant') || category.includes('jean')) {
			return sizeOptions.pants;
		} else {
			return sizeOptions.clothing;
		}
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();

			reader.onloadend = () => {
				setNewProduct({ ...newProduct, image: reader.result });
			};

			reader.readAsDataURL(file); // base64
		}
	};

	return (
		<motion.div
			className='bg-gray-800 shadow-lg rounded-lg p-8 mb-8 max-w-xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
			<h2 className='text-2xl font-semibold mb-6 text-emerald-300'>Create New Product</h2>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label htmlFor='name' className='block text-sm font-medium text-gray-300'>
						Product Name
					</label>
					<input
						type='text'
						id='name'
						name='name'
						value={newProduct.name}
						onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2
						 px-3 text-white focus:outline-none focus:ring-2
						focus:ring-emerald-500 focus:border-emerald-500'
						required
					/>
				</div>

				<div>
					<label htmlFor='description' className='block text-sm font-medium text-gray-300'>
						Description
					</label>
					<textarea
						id='description'
						name='description'
						value={newProduct.description}
						onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
						rows='3'
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm
						 py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 
						 focus:border-emerald-500'
						required
					/>
				</div>

				<div>
					<label htmlFor='price' className='block text-sm font-medium text-gray-300'>
						Price
					</label>
					<input
						type='number'
						id='price'
						name='price'
						value={newProduct.price}
						onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
						step='0.01'
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
						py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
						 focus:border-emerald-500'
						required
					/>
				</div>

				<div>
					<label htmlFor='category' className='block text-sm font-medium text-gray-300'>
						Category
					</label>
					<select
						id='category'
						name='category'
						value={newProduct.category}
						onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md
						 shadow-sm py-2 px-3 text-white focus:outline-none 
						 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
						required					>
						<option value=''>
							{categoriesLoading ? 'Loading categories...' : 'Select a category'}
						</option>
						{activeCategories.length === 0 && !categoriesLoading ? (
							<option value='' disabled>
								No active categories available
							</option>
						) : (
							activeCategories.map((category) => (
								<option key={category._id} value={category.slug}>
									{category.name}
								</option>
							))
						)}
					</select>				</div>

				{/* Sizes Section */}
				{(showSizes || newProduct.sizes.length > 0) && (
					<div>
						<div className="flex items-center justify-between mb-3">
							<label className='block text-sm font-medium text-gray-300'>
								Available Sizes
							</label>
							<button
								type="button"
								onClick={() => setShowSizes(!showSizes)}
								className="text-sm text-emerald-400 hover:text-emerald-300"
							>
								{showSizes ? 'Hide Sizes' : 'Add Sizes'}
							</button>
						</div>
						
						{showSizes && (
							<div className="space-y-4">
								<div className="grid grid-cols-4 gap-2">
									{getSizeOptionsForCategory().map((size) => (
										<button
											key={size}
											type="button"
											onClick={() => handleSizeToggle(size)}
											className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
												newProduct.sizes.includes(size)
													? 'bg-emerald-600 text-white'
													: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
											}`}
										>
											{size}
										</button>
									))}
								</div>
								
								{/* Stock Management */}
								{newProduct.sizes.length > 0 && (
									<div className="space-y-2">
										<label className='block text-sm font-medium text-gray-300'>
											Stock per Size
										</label>
										<div className="grid grid-cols-2 gap-3">
											{newProduct.sizes.map((size) => (
												<div key={size} className="flex items-center space-x-2">
													<span className="text-sm text-gray-300 w-8">{size}:</span>
													<input
														type="number"
														min="0"
														value={newProduct.stock[size] || 0}
														onChange={(e) => handleStockChange(size, e.target.value)}
														className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
													/>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				)}

				<div className='mt-1 flex items-center'>
					<input type='file' id='image' className='sr-only' accept='image/*' onChange={handleImageChange} />
					<label
						htmlFor='image'
						className='cursor-pointer bg-gray-700 py-2 px-3 border border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
					>
						<Upload className='h-5 w-5 inline-block mr-2' />
						Upload Image
					</label>
					{newProduct.image && <span className='ml-3 text-sm text-gray-400'>Image uploaded </span>}
				</div>

				<button
					type='submit'
					className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
					shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50'
					disabled={loading}
				>
					{loading ? (
						<>
							<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
							Loading...
						</>
					) : (
						<>
							<PlusCircle className='mr-2 h-5 w-5' />
							Create Product
						</>
					)}
				</button>
			</form>
		</motion.div>
	);
};
export default CreateProductForm;
