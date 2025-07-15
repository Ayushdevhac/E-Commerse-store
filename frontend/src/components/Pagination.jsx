import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    totalProducts,
    limit,
    className = ""
}) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const showPages = 5; // Number of page buttons to show
        
        if (totalPages <= showPages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show first page, current page area, and last page
            pages.push(1);
            
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);
            
            // Adjust window if too close to edges
            if (currentPage <= 3) {
                start = 2;
                end = 4;
            } else if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
                end = totalPages - 1;
            }
            
            if (start > 2) {
                pages.push('...');
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            if (end < totalPages - 1) {
                pages.push('...');
            }
            
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const pageNumbers = getPageNumbers();
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalProducts);

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
            {/* Results info */}
            <div className="text-sm text-gray-400">
                Showing {startItem} to {endItem} of {totalProducts} products
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
                {/* Previous button */}
                <motion.button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:bg-gray-900 disabled:text-gray-600 hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                    whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                </motion.button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => (
                        <div key={index}>
                            {page === '...' ? (
                                <div className="px-3 py-2 text-gray-500">
                                    <MoreHorizontal size={16} />
                                </div>
                            ) : (
                                <motion.button
                                    onClick={() => onPageChange(page)}
                                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                        currentPage === page
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {page}
                                </motion.button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Next button */}
                <motion.button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:bg-gray-900 disabled:text-gray-600 hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                    whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={16} />
                </motion.button>
            </div>
        </div>
    );
};

export default Pagination;
