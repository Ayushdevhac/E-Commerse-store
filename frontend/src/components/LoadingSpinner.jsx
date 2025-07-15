import { motion } from 'framer-motion';

const LoadingSpinner = ({ 
  size = 'large', 
  message = 'Loading...', 
  fullScreen = true,
  variant = 'default' 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  const containerClasses = fullScreen 
    ? 'flex items-center justify-center min-h-screen bg-gray-900'
    : 'flex items-center justify-center p-8';

  const spinnerVariants = {
    default: (
      <div className="relative">
        <motion.div 
          className={`${sizeClasses[size]} border-4 border-gray-700 rounded-full`}
          animate={{ rotate: 0 }}
        />
        <motion.div 
          className={`${sizeClasses[size]} border-4 border-transparent border-t-emerald-500 border-r-emerald-400 rounded-full absolute left-0 top-0`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className={`${sizeClasses[size]} border-2 border-transparent border-b-emerald-300 rounded-full absolute left-0 top-0`}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    ),
    pulse: (
      <div className="relative">
        <motion.div 
          className={`${sizeClasses[size]} bg-emerald-500 rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className={`${sizeClasses[size]} bg-emerald-400 rounded-full absolute left-0 top-0`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
        />
      </div>
    ),
    dots: (
      <div className="flex space-x-2">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-emerald-500 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.2
            }}
          />
        ))}
      </div>
    ),
    bars: (
      <div className="flex space-x-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            className="w-2 bg-emerald-500 rounded-full"
            animate={{
              height: ['10px', '40px', '10px'],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.1
            }}
          />
        ))}
      </div>
    ),
    ring: (
      <div className="relative">
        <motion.div 
          className={`${sizeClasses[size]} border-4 border-gray-700 rounded-full`}
        />
        <motion.div 
          className={`${sizeClasses[size]} border-4 border-transparent border-t-emerald-500 rounded-full absolute left-0 top-0`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className={`w-3 h-3 bg-emerald-500 rounded-full absolute`}
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    )
  };

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          {spinnerVariants[variant]}
        </motion.div>
        
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300"
          >
            <p className="text-lg font-medium mb-2">{message}</p>
            <motion.div
              className="text-sm text-gray-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Please wait...
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
