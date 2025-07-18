import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
        cookiePathRewrite: {
          '*': '/'
        },
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Force cookie domain rewriting for localhost development
            if (proxyRes.headers['set-cookie']) {
              proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => {
                // Remove domain restrictions for localhost development
                return cookie
                  .replace(/Domain=localhost:5000/gi, '')
                  .replace(/Domain=localhost/gi, '')
                  .replace(/; Domain=[^;]*/gi, ''); // Remove any Domain directive
              });
            }
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Enable sourcemaps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    // Make sure environment variables are available
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  }
})
