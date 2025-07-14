import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CategoryItem = ({ category }) => {
	return (
		<motion.div
			className='relative overflow-hidden h-80 w-full rounded-2xl group'
			whileHover={{ scale: 1.02 }}
			transition={{ duration: 0.3 }}
		>
			<Link to={`/category/${category.href}`}>
				<div className='w-full h-full cursor-pointer relative'>
					{/* Enhanced gradient overlay */}
					<div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 z-10' />
					<div className='absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-15' />
					
					<motion.img
						src={category.imageUrl}
						alt={category.name}
						className='w-full h-full object-cover'
						whileHover={{ scale: 1.1 }}
						transition={{ duration: 0.6 }}
						loading='lazy'
					/>
					
					{/* Content */}
					<div className='absolute bottom-0 left-0 right-0 p-6 z-20'>
						<motion.h3 
							className='text-white text-2xl font-bold mb-2 group-hover:text-emerald-400 transition-colors duration-300'
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.1 }}
						>
							{category.name}
						</motion.h3>
						<motion.div
							className='flex items-center gap-2 text-gray-200 group-hover:text-white transition-colors duration-300'
							initial={{ y: 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							<span className='text-sm'>Explore Collection</span>
							<ArrowRight className='w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300' />
						</motion.div>
					</div>

					{/* Hover overlay with border effect */}
					<div className='absolute inset-0 border-2 border-transparent group-hover:border-emerald-400/50 rounded-2xl transition-all duration-300 z-30' />
				</div>
			</Link>
		</motion.div>
	);
};

export default CategoryItem;
