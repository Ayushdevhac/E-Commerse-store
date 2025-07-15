import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";

const SearchComponent = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState([]); // Ensure it's always an array
	const [recentSearches, setRecentSearches] = useState([]);
	const [popularSearches] = useState(['jeans', 'shoes', 't-shirts', 'jackets', 'bags']);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const searchRef = useRef(null);
	const navigate = useNavigate();

	// Load recent searches from localStorage
	useEffect(() => {
		const saved = localStorage.getItem('recentSearches');
		if (saved) {
			try {
				setRecentSearches(JSON.parse(saved));
			} catch (error) {
				console.error('Failed to parse recent searches:', error);
				setRecentSearches([]);
			}
		}
	}, []);

	// Close search on outside click
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (searchRef.current && !searchRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Debounced search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (query.trim() && query.length >= 2) {
				searchProducts();
			} else {
				setResults([]);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [query]);
	const searchProducts = async () => {
		if (!query.trim()) return;
		
		setLoading(true);
		setError(null);
		try {
			const response = await axios.get(`/products/search?q=${encodeURIComponent(query)}&limit=5`);
			// The API returns { products: [...], pagination: {...} }
			const products = response.data?.products;
			if (Array.isArray(products)) {
				setResults(products);
			} else {
				console.warn("API response doesn't contain products array:", response.data);
				setResults([]);
			}
		} catch (error) {
			console.error("Search error:", error);
			setError(error.message || 'Search failed');
			setResults([]);
		} finally {
			setLoading(false);
		}
	};

	const saveRecentSearch = (searchQuery) => {
		const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
		setRecentSearches(updated);
		localStorage.setItem('recentSearches', JSON.stringify(updated));
	};

	const handleSearch = (searchQuery) => {
		if (!searchQuery.trim()) return;
		
		saveRecentSearch(searchQuery);
		navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
		setIsOpen(false);
		setQuery('');
	};

	const clearRecentSearches = () => {
		setRecentSearches([]);
		localStorage.removeItem('recentSearches');
	};

	useEffect(() => {
		let mounted = true;
		
		const performSearch = async () => {
			try {
				setError(null);
				if (query.length > 2) {
					await searchProducts();
				} else {
					if (mounted) {
						setResults([]);
					}
				}
			} catch (error) {
				console.error("Search effect error:", error);
				if (mounted) {
					setError(error.message);
					setResults([]);
				}
			}
		};

		performSearch();

		return () => {
			mounted = false;
		};	}, [query]);

	const handleProductClick = (productId) => {
		try {
			setIsOpen(false);
			setQuery("");
			setResults([]);
			setError(null);
			navigate(`/product/${productId}`);
		} catch (error) {
			console.error("Navigation error:", error);
		}
	};
	const toggleSearch = () => {
		try {
			setIsOpen(!isOpen);
			if (!isOpen) {
				setTimeout(() => document.getElementById("search-input")?.focus(), 100);
			} else {
				setQuery("");
				setResults([]);
				setError(null);
			}
		} catch (error) {
			console.error("Toggle search error:", error);
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
						</div>						{/* Search Results */}
						<div className="max-h-96 overflow-y-auto">
							{loading && (
								<div className="p-4 text-center text-gray-400">
									Searching...
								</div>
							)}

							{error && (
								<div className="p-4 text-center text-red-400">
									Error: {error}
								</div>
							)}

							{!loading && !error && (!results || results.length === 0) && query.length > 2 && (
								<div className="p-4 text-center text-gray-400">
									No products found for "{query}"
								</div>
							)}

							{!loading && !error && Array.isArray(results) && results.length > 0 && results.map((product) => {
								// Defensive check for product object
								if (!product || typeof product !== 'object') {
									return null;
								}

								return (
									<div
										key={product._id || Math.random()}
										onClick={() => handleProductClick(product._id)}
										className="p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
									>
										<div className="flex items-center space-x-3">
											<img
												src={product.image || '/placeholder-image.jpg'}
												alt={product.name || 'Product'}
												className="w-12 h-12 object-cover rounded"
												onError={(e) => {
													e.target.src = '/placeholder-image.jpg';
												}}
											/>
											<div className="flex-1">
												<h4 className="text-white font-medium">{product.name || 'Unnamed Product'}</h4>
												<p className="text-gray-400 text-sm">{product.category || 'Uncategorized'}</p>
												<p className="text-emerald-400 font-bold">${product.price || '0'}</p>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default SearchComponent;
