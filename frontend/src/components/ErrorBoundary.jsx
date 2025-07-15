import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Log detailed error information
      console.error('ErrorBoundary Details:', {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        stack: this.state.error?.stack
      });

      // If it's a simple fallback, show minimal error
      if (this.props.fallback) {
        return (
          <div className="text-red-400 text-sm p-2 bg-red-900 bg-opacity-20 rounded">
            {this.props.fallback}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs mt-1 opacity-75">
                {this.state.error?.message}
              </div>
            )}
          </div>
        );
      }

      // Full error page
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gray-900">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center border border-gray-700"
          >
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-red-600/20 rounded-full mb-6"
            >
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              We encountered an unexpected error. Don't worry, this has been logged and we'll fix it soon.
            </p>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={this.handleRetry}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center group"
              >
                <RefreshCw className="mr-2 w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                Try Again
              </motion.button>

              <a
                href="/"
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <Home className="mr-2 w-4 h-4" />
                Return Home
              </a>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-300">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-gray-500 bg-gray-900 p-3 rounded overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
