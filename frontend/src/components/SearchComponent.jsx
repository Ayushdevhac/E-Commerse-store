import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";

const SearchComponent = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		if (query.length > 2) {
			searchProducts();
		} else {
			setResults([]);
		}
	}, [query]);

	const searchProducts = async () => {
		setLoading(true);
		try {
			const response = await axios.get(`/products/search?q=${encodeURIComponent(query)}`);
			setResults(response.data);
		} catch (error) {
			console.error("Search error:", error);
			setResults([]);
		} finally {
			setLoading(false);
		}
	};

	const handleProductClick = (productId) => {
		setIsOpen(false);
		setQuery("");
		setResults([]);
		navigate(`/product/${productId}`);
	};

	const toggleSearch = () => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			setTimeout(() => document.getElementById("search-input")?.focus(), 100);
		} else {
			setQuery("");
			setResults([]);
		}
	};

	return (
		<>
			{/* Search Button */}
			<button
				onClick={toggleSearch}
				className="text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out"
			>
				<Search size={20} />
			</button>

			{/* Search Modal */}
			{isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
					<div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
						<div className="p-4 border-b border-gray-700">
							<div className="flex items-center">
								<Search className="w-5 h-5 text-gray-400 mr-3" />
								<input
									id="search-input"
									type="text"
									placeholder="Search products..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
								/>
								<button
									onClick={toggleSearch}
									className="text-gray-400 hover:text-white ml-3"
								>
									<X size={20} />
								</button>
							</div>
						</div>

						{/* Search Results */}
						<div className="max-h-96 overflow-y-auto">
							{loading && (
								<div className="p-4 text-center text-gray-400">
									Searching...
								</div>
							)}

							{!loading && results.length === 0 && query.length > 2 && (
								<div className="p-4 text-center text-gray-400">
									No products found for "{query}"
								</div>
							)}

							{results.map((product) => (
								<div
									key={product._id}
									onClick={() => handleProductClick(product._id)}
									className="p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
								>
									<div className="flex items-center space-x-3">
										<img
											src={product.image}
											alt={product.name}
											className="w-12 h-12 object-cover rounded"
										/>
										<div className="flex-1">
											<h4 className="text-white font-medium">{product.name}</h4>
											<p className="text-gray-400 text-sm">{product.category}</p>
											<p className="text-emerald-400 font-bold">${product.price}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default SearchComponent;
