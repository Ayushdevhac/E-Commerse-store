// Debug script to add to your main.jsx temporarily
console.log('=== DEBUGGING INFO ===');
console.log('Environment:', import.meta.env.MODE);
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Base URL:', import.meta.env.BASE_URL);
console.log('All env vars:', import.meta.env);

// Test API connectivity
fetch('/api/health').then(response => {
  console.log('API Health Check:', response.status);
  return response.json();
}).then(data => {
  console.log('API Health Data:', data);
}).catch(error => {
  console.error('API Health Error:', error);
});

console.log('=== END DEBUG INFO ===');
