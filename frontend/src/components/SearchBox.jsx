import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { useProductStore } from '../stores/useProductStore';

const SearchBox = ({ className = '' }) => {
	const [query, setQuery] = useState('');
	const [isOpen, setIsOpen] = useState(false);
	const [results, setResults] = useState([]);
	const [recentSearches, setRecentSearches] = useState([]);
	const [popularSearches] = useState(['jeans', 'shoes', 't-shirts', 'jackets', 'bags']);
	const [isLoading, setIsLoading] = useState(false);
	const searchRef = useRef(null);
	const inputRef = useRef(null);
	const navigate = useNavigate();
	const { searchProducts } = useProductStore();

	// Load recent searches from localStorage
	useEffect(() => {
		const saved = localStorage.getItem('recentSearches');
		if (saved) {
			setRecentSearches(JSON.parse(saved));
		}
	}, []);

	// Debounced search
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (query.trim() && query.length >= 2) {
				performSearch(query);
			} else {
				setResults([]);
			}
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [query]);

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

	const performSearch = async (searchQuery) => {
		if (!searchQuery.trim()) return;
		
		setIsLoading(true);
		try {
			const response = await axios.get(`/products/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
			setResults(response.data.products || []);
		} catch (error) {
			console.error('Search error:', error);
			setResults([]);
		} finally {
			setIsLoading(false);
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
		searchProducts(searchQuery);
		navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
		setIsOpen(false);
		setQuery('');
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			handleSearch(query);
		}
		if (e.key === 'Escape') {
			setIsOpen(false);
			inputRef.current?.blur();
		}
	};

	const clearRecentSearches = () => {
		setRecentSearches([]);
		localStorage.removeItem('recentSearches');
	};

	return (
		<div ref={searchRef} className={`relative ${className}`}>
			{/* Search Input */}
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					placeholder="Search products..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => setIsOpen(true)}
					onKeyDown={handleKeyPress}
					className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
				/>
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
				
				{query && (
					<button
						onClick={() => {
							setQuery('');
							setResults([]);
						}}
						className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
					>
						<X className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Search Dropdown */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
					>
						{/* Loading State */}
						{isLoading && (
							<div className="p-4 text-center">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto"></div>
								<p className="text-gray-400 text-sm mt-2">Searching...</p>
							</div>
						)}

						{/* Search Results */}
						{results.length > 0 && !isLoading && (
							<div className="border-b border-gray-700">
								<div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
									Products
								</div>
								{results.map((product) => (
									<button
										key={product._id}
										onClick={() => {
											navigate(`/product/${product._id}`);
											setIsOpen(false);
											setQuery('');
										}}
										className="w-full p-3 hover:bg-gray-700 flex items-center space-x-3 text-left transition-colors"
									>
										<img
											src={product.image}
											alt={product.name}
											className="w-10 h-10 object-cover rounded"
										/>
										<div className="flex-1 min-w-0">
											<p className="text-white font-medium truncate">{product.name}</p>
											<p className="text-gray-400 text-sm">${product.price}</p>
										</div>
									</button>
								))}
							</div>
						)}

						{/* Recent Searches */}
						{recentSearches.length > 0 && !query && (
							<div className="border-b border-gray-700">
								<div className="p-3 flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Clock className="w-4 h-4 text-gray-400" />
										<span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
											Recent
										</span>
									</div>
									<button
										onClick={clearRecentSearches}
										className="text-xs text-gray-500 hover:text-gray-400"
									>
										Clear
									</button>
								</div>
								{recentSearches.map((search, index) => (
									<button
										key={index}
										onClick={() => handleSearch(search)}
										className="w-full p-3 hover:bg-gray-700 text-left text-gray-300 transition-colors"
									>
										{search}
									</button>
								))}
							</div>
						)}

						{/* Popular Searches */}
						{!query && (
							<div>
								<div className="p-3 flex items-center space-x-2">
									<TrendingUp className="w-4 h-4 text-gray-400" />
									<span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
										Popular
									</span>
								</div>
								<div className="p-3 pt-0">
									<div className="flex flex-wrap gap-2">
										{popularSearches.map((search, index) => (
											<button
												key={index}
												onClick={() => handleSearch(search)}
												className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-full transition-colors"
											>
												{search}
											</button>
										))}
									</div>
								</div>
							</div>
						)}

						{/* No Results */}
						{query && results.length === 0 && !isLoading && (
							<div className="p-4 text-center">
								<p className="text-gray-400">No products found for "{query}"</p>
								<button
									onClick={() => handleSearch(query)}
									className="mt-2 text-emerald-400 hover:text-emerald-300 text-sm"
								>
									Search anyway
								</button>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default SearchBox;
