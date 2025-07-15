import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, Heart, User, ChevronDown, Menu, X, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import SearchComponent from "./SearchComponent";
import ErrorBoundary from "./ErrorBoundary";

const Navbar = () => {
	const { user, logout } = useUserStore();
	const isAdmin = useMemo(() => user?.role === "admin", [user?.role]);
	const { cart } = useCartStore();
	const { wishlist } = useWishlistStore();
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const userMenuRef = useRef(null);
	const mobileMenuRef = useRef(null);

	// Close menus when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
				setIsUserMenuOpen(false);
			}
			if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
				setIsMobileMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Close mobile menu on window resize
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setIsMobileMenuOpen(false);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<header className='fixed top-0 left-0 w-full bg-gray-900 bg-opacity-95 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-emerald-800'>
			<div className='container mx-auto px-4 py-3'>
				<div className='flex justify-between items-center'>
					{/* Logo */}
					<Link to='/' className='text-xl md:text-2xl font-bold text-emerald-400 flex items-center space-x-2'>
						<span>E-Commerce</span>
					</Link>

					{/* Desktop Navigation */}
					<nav className='hidden md:flex items-center gap-4 lg:gap-6'>						<Link
							to={"/"}
							className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out'
						>
							Home
						</Link>
						
						<ErrorBoundary fallback="Search unavailable">
							<SearchComponent />
						</ErrorBoundary>
						
						{user && (
							<>								<Link
									to={"/wishlist"}
									className='relative group text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center'
								>
									<Heart className='group-hover:text-emerald-400' size={20} />
									<span className='ml-1 hidden lg:inline'>Wishlist</span>
									{wishlist.length > 0 && (
										<span className='absolute -top-2 -left-2 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[1.25rem] text-center'>
											{wishlist.length}
										</span>
									)}
								</Link>

								<Link
									to={"/reviews"}
									className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center'
								>
									<Star className='hover:text-emerald-400' size={20} />
									<span className='ml-1 hidden lg:inline'>Reviews</span>
								</Link>
								
								<Link
									to={"/cart"}
									className='relative group text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center'
								>
									<ShoppingCart className='group-hover:text-emerald-400' size={20} />
									<span className='ml-1 hidden lg:inline'>Cart</span>
									{cart.length > 0 && (
										<span className='absolute -top-2 -left-2 bg-emerald-500 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[1.25rem] text-center'>
											{cart.length}
										</span>
									)}
								</Link>
							</>
						)}
						
						{isAdmin && (
							<Link
								className='bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md font-medium transition duration-300 ease-in-out flex items-center'
								to={"/secret-dashboard"}
							>
								<Lock className='mr-1' size={16} />
								<span className='hidden lg:inline'>Dashboard</span>
								<span className='lg:hidden'>Admin</span>
							</Link>
						)}
								{user ? (
							<div className="flex items-center space-x-4">
								{/* User Greeting */}
								<span className="text-emerald-400 font-medium hidden sm:inline">
									Hi, {user.name.split(' ')[0]}!
								</span>
								
								<div className="relative" ref={userMenuRef}>
									<button
										onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
										className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-md flex items-center transition duration-300 ease-in-out'
									>
										<User size={16} />
										<span className='ml-2 hidden lg:inline max-w-20 truncate'>{user.name}</span>
										<ChevronDown size={14} className="ml-1" />
									</button>
										{isUserMenuOpen && (
									<div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-50">
										<div className="py-1">
											<Link
												to="/profile"
												className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
												onClick={() => setIsUserMenuOpen(false)}
											>
												<User size={16} className="inline mr-2" />
												My Profile
											</Link>
											<Link
												to="/order-history"
												className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
												onClick={() => setIsUserMenuOpen(false)}
											>
												<ShoppingCart size={16} className="inline mr-2" />
												Order History
											</Link>
											<hr className="border-gray-700 my-1" />
											<button
												onClick={() => {
													logout();
													setIsUserMenuOpen(false);
												}}
												className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
											>
												<LogOut size={16} className="inline mr-2" />
												Log Out
											</button>
										</div>
									</div>
								)}
							</div>
						</div>
						) : (
							<div className="flex items-center gap-2">
								<Link
									to={"/signup"}
									className='bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-md flex items-center transition duration-300 ease-in-out text-sm'
								>
									<UserPlus className='mr-1' size={16} />
									<span className="hidden lg:inline">Sign Up</span>
									<span className="lg:hidden">Sign Up</span>
								</Link>
								<Link
									to={"/login"}
									className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-md flex items-center transition duration-300 ease-in-out text-sm'
								>
									<LogIn className='mr-1' size={16} />
									<span className="hidden lg:inline">Login</span>
									<span className="lg:hidden">Login</span>
								</Link>
							</div>
						)}
					</nav>

					{/* Mobile Menu Button */}
					<button
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className='md:hidden text-gray-300 hover:text-emerald-400 transition-colors p-2'
					>
						{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>

				{/* Mobile Navigation */}
				{isMobileMenuOpen && (
					<div 
						ref={mobileMenuRef}
						className='md:hidden mt-4 pb-4 border-t border-gray-700 pt-4'
					>
						<div className='flex flex-col space-y-3'>
							<Link
								to={"/"}
								className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out py-2'
								onClick={() => setIsMobileMenuOpen(false)}
							>
								Home							</Link>
							
							<div className="py-2">
								<ErrorBoundary fallback="Search unavailable">
									<SearchComponent />
								</ErrorBoundary>
							</div>
									{user && (
								<>
									{/* Mobile User Greeting */}
									<div className="py-2 border-b border-gray-700 mb-2">
										<span className="text-emerald-400 font-medium text-lg">
											Hi, {user.name.split(' ')[0]}!
										</span>
									</div>
											<Link
										to={"/wishlist"}
										className='relative text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center py-2'
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<Heart size={20} className="mr-3" />
										<span>Wishlist</span>
										{wishlist.length > 0 && (
											<span className='ml-auto bg-red-500 text-white rounded-full px-2 py-1 text-xs'>
												{wishlist.length}
											</span>
										)}
									</Link>

									<Link
										to={"/reviews"}
										className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center py-2'
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<Star size={20} className="mr-3" />
										<span>Reviews</span>
									</Link>
									
									<Link
										to={"/cart"}
										className='relative text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center py-2'
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<ShoppingCart size={20} className="mr-3" />
										<span>Cart</span>
										{cart.length > 0 && (
											<span className='ml-auto bg-emerald-500 text-white rounded-full px-2 py-1 text-xs'>
												{cart.length}
											</span>
										)}
									</Link>

									<Link
										to={"/profile"}
										className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center py-2'
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<User size={20} className="mr-3" />
										<span>My Profile</span>
									</Link>

									<Link
										to={"/order-history"}
										className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center py-2'
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<ShoppingCart size={20} className="mr-3" />
										<span>Order History</span>
									</Link>
								</>
							)}
							
							{isAdmin && (
								<Link
									to={"/secret-dashboard"}
									className='bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition duration-300 ease-in-out flex items-center'
									onClick={() => setIsMobileMenuOpen(false)}
								>
									<Lock className='mr-3' size={20} />
									<span>Admin Dashboard</span>
								</Link>
							)}
							
							{user ? (
								<button
									onClick={() => {
										logout();
										setIsMobileMenuOpen(false);
									}}
									className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center py-2 text-left'
								>
									<LogOut size={20} className="mr-3" />
									<span>Log Out</span>
								</button>
							) : (
								<div className="flex flex-col space-y-2 pt-2">
									<Link
										to={"/signup"}
										className='bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-md flex items-center justify-center transition duration-300 ease-in-out'
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<UserPlus className='mr-2' size={20} />
										Sign Up
									</Link>
									<Link
										to={"/login"}
										className='bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-md flex items-center justify-center transition duration-300 ease-in-out'
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<LogIn className='mr-2' size={20} />
										Login
									</Link>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</header>
	);
};

export default Navbar;
