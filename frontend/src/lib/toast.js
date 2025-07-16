import toast from 'react-hot-toast';

// Track active toasts to prevent duplicates
const activeToasts = new Set();

// Debounce time in milliseconds
const DEBOUNCE_TIME = 1000;

export const showToast = {
  success: (message, options = {}) => {
    const toastId = `success-${message}`;
    
    if (activeToasts.has(toastId)) {
      return;
    }
    
    activeToasts.add(toastId);
    
    const finalOptions = {
      id: toastId,
      duration: 3000,
      ...options,
    };
    
    const toastInstance = toast.success(message, finalOptions);
    
    // Remove from active toasts after debounce time
    setTimeout(() => {
      activeToasts.delete(toastId);
    }, DEBOUNCE_TIME);
    
    return toastInstance;
  },
  
  error: (message, options = {}) => {
    const toastId = `error-${message}`;
    
    if (activeToasts.has(toastId)) {
      return;
    }
    
    activeToasts.add(toastId);
    
    const finalOptions = {
      id: toastId,
      duration: 4000,
      ...options,
    };
    
    const toastInstance = toast.error(message, finalOptions);
    
    // Remove from active toasts after debounce time
    setTimeout(() => {
      activeToasts.delete(toastId);
    }, DEBOUNCE_TIME);
      return toastInstance;
  },
  
  warning: (message, options = {}) => {
    const toastId = `warning-${message}`;
    
    if (activeToasts.has(toastId)) {
      return;
    }
    
    activeToasts.add(toastId);
    
    const finalOptions = {
      id: toastId,
      duration: 3500,
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
      ...options,
    };
    
    const toastInstance = toast(message, finalOptions);
    
    // Remove from active toasts after debounce time
    setTimeout(() => {
      activeToasts.delete(toastId);
    }, DEBOUNCE_TIME);
    
    return toastInstance;
  },
  
  loading: (message, options = {}) => {
    const toastId = `loading-${message}`;
    
    if (activeToasts.has(toastId)) {
      return;
    }
    
    activeToasts.add(toastId);
    
    const finalOptions = {
      id: toastId,
      ...options,
    };
    
    const toastInstance = toast.loading(message, finalOptions);
    
    return toastInstance;
  },
  
  // Custom method to dismiss a specific toast and clean up
  dismiss: (toastId) => {
    toast.dismiss(toastId);
    activeToasts.delete(toastId);
  },
  
  // Method to clear all active toasts
  clear: () => {
    toast.dismiss();
    activeToasts.clear();
  }
};

export default showToast;
