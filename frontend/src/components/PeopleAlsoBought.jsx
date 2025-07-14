import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "./ProductCard";
import axios from "../lib/axios";
import showToast from "../lib/toast";
import LoadingSpinner from "./LoadingSpinner";

const PeopleAlsoBought = () => {
	const [recommendations, setRecommendations] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [itemsPerView, setItemsPerView] = useState(3);
	const [isAutoPlaying, setIsAutoPlaying] = useState(true);
	const [isPaused, setIsPaused] = useState(false);
	const carouselRef = useRef(null);
	const autoScrollRef = useRef(null);

	useEffect(() => {
		const fetchRecommendations = async () => {
			try {
				const res = await axios.get("/products/recommendations");
				setRecommendations(res.data);			} catch (error) {
				showToast.error(error.response.data.message || "An error occurred while fetching recommendations");
			} finally {
				setIsLoading(false);
			}
		};

		fetchRecommendations();
	}, []);

	// Handle responsive items per view
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 640) {
				setItemsPerView(1);
			} else if (window.innerWidth < 1024) {
				setItemsPerView(2);
			} else {
				setItemsPerView(3);
			}
		};

		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const nextSlide = useCallback(() => {
		const maxIndex = Math.max(0, recommendations.length - itemsPerView);
		setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
	}, [recommendations.length, itemsPerView]);

	const prevSlide = () => {
		const maxIndex = Math.max(0, recommendations.length - itemsPerView);
		setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
	};

	const goToSlide = (index) => {
		const maxIndex = Math.max(0, recommendations.length - itemsPerView);
		setCurrentIndex(Math.min(index, maxIndex));
	};

	// Auto-scroll functionality
	useEffect(() => {
		if (isAutoPlaying && !isPaused && recommendations.length > itemsPerView) {
			autoScrollRef.current = setInterval(() => {
				nextSlide();
			}, 4000); // Change slide every 4 seconds
		}

		return () => {
			if (autoScrollRef.current) {
				clearInterval(autoScrollRef.current);
			}
		};
	}, [isAutoPlaying, isPaused, nextSlide, recommendations.length, itemsPerView]);

	const toggleAutoPlay = () => {
		setIsAutoPlaying(!isAutoPlaying);
	};

	const handleMouseEnter = () => {
		setIsPaused(true);
	};

	const handleMouseLeave = () => {
		setIsPaused(false);
	};

	if (isLoading) return <LoadingSpinner />;

	if (recommendations.length === 0) {
		return null;
	}

	const showNavigation = recommendations.length > itemsPerView;
	const totalSlides = Math.ceil(recommendations.length / itemsPerView);

	return (
		<div className='mt-8'>
			<div className="flex items-center justify-between mb-6">
				<h3 className='text-2xl font-semibold text-emerald-400'>People also bought</h3>
				
				{showNavigation && (
					<div className="flex items-center gap-2">
						<button
							onClick={toggleAutoPlay}
							className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300 hover:scale-110"
							aria-label={isAutoPlaying ? "Pause auto-scroll" : "Start auto-scroll"}
						>
							{isAutoPlaying ? <Pause size={20} /> : <Play size={20} />}
						</button>
						<button
							onClick={prevSlide}
							className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300 hover:scale-110"
							aria-label="Previous products"
						>
							<ChevronLeft size={20} />
						</button>
						<button
							onClick={nextSlide}
							className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300 hover:scale-110"
							aria-label="Next products"
						>
							<ChevronRight size={20} />
						</button>
					</div>
				)}
			</div>

			<div 
				className="relative overflow-hidden rounded-lg" 
				ref={carouselRef}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
			>
				<motion.div
					className="flex gap-4"
					animate={{
						x: `${-currentIndex * (100 / itemsPerView)}%`
					}}
					transition={{
						type: "spring",
						stiffness: 300,
						damping: 30
					}}
					style={{
						width: `${(recommendations.length / itemsPerView) * 100}%`
					}}
				>
					{recommendations.map((product, index) => (
						<motion.div
							key={product._id}
							className="flex-shrink-0 px-2"
							style={{ width: `${100 / recommendations.length}%` }}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
							whileHover={{ scale: 1.02 }}
						>
							<ProductCard product={product} />
						</motion.div>
					))}
				</motion.div>

				{/* Progress bar */}
				{showNavigation && isAutoPlaying && (
					<div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
						<motion.div
							className="h-full bg-emerald-400"
							initial={{ width: "0%" }}
							animate={{ width: isPaused ? "0%" : "100%" }}
							transition={{
								duration: isPaused ? 0 : 4,
								ease: "linear",
								repeat: isPaused ? 0 : Infinity
							}}
						/>
					</div>
				)}
			</div>

			{/* Dots indicator */}
			{showNavigation && (
				<div className="flex justify-center mt-6 gap-2">
					{Array.from({ length: totalSlides }).map((_, index) => (
						<button
							key={index}
							onClick={() => goToSlide(index)}
							className={`w-3 h-3 rounded-full transition-all duration-300 ${
								index === currentIndex
									? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/50'
									: 'bg-gray-600 hover:bg-gray-500'
							}`}
							aria-label={`Go to slide ${index + 1}`}
						/>
					))}
				</div>
			)}

			{/* Slide counter */}
			{showNavigation && (
				<div className="mt-4 text-center">
					<div className="text-xs text-gray-400">
						{currentIndex + 1} of {totalSlides} • {recommendations.length} products
						{isAutoPlaying && <span className="ml-2">• Auto-scrolling</span>}					</div>
				</div>
			)}
		</div>
	);
};

export default PeopleAlsoBought;
            