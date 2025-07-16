import { useEffect } from 'react';

const DebugInfo = () => {
  useEffect(() => {
    console.log('=== DEBUGGING INFO ===');
    console.log('Environment:', import.meta.env.MODE);
    console.log('API URL:', import.meta.env.VITE_API_URL);
    console.log('Base URL:', import.meta.env.BASE_URL);
    console.log('All env vars:', import.meta.env);

    // Test API connectivity
    fetch('/api/health')
      .then(response => {
        console.log('API Health Check:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('API Health Data:', data);
      })
      .catch(error => {
        console.error('API Health Error:', error);
      });

    console.log('=== END DEBUG INFO ===');
  }, []);

  // Only show in development
  if (import.meta.env.MODE === 'production') {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 bg-black bg-opacity-80 text-white p-2 text-xs z-50 max-w-xs">
      <div>Mode: {import.meta.env.MODE}</div>
      <div>API: {import.meta.env.VITE_API_URL || 'Not set'}</div>
    </div>
  );
};

export default DebugInfo;
