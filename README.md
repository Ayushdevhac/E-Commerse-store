# 🛒 E-Commerce Store

A full-stack modern e-commerce application built with React, Node.js, Express, and MongoDB. Features a responsive design, robust cart functionality, secure authentication, and comprehensive admin dashboard.

> 🔒 **Enterprise-Grade Security**: Built with production-ready security features including JWT authentication, password encryption, CORS protection, rate limiting, input validation, and XSS/CSRF protection.

![E-Commerce Store](./frontend/public/screenshot1-for-readme.png)
![E-Commerce Store - Admin Dashboard](./frontend/public/screenshot2-for-readme.png)

## 🌟 Features

### 🛍️ **Customer Features**
- **Product Catalog** - Browse products by categories with advanced filtering
- **Search & Filter** - Real-time search with price range and category filters
- **Shopping Cart** - Add/remove items with real-time stock validation
- **Wishlist** - Save favorite products for later
- **User Authentication** - Secure login/signup with JWT tokens
- **Order Management** - View order history and track purchases
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Featured Products Carousel** - Interactive showcase with auto-play
- **Product Reviews** - Rate and review products
- **Secure Checkout** - Stripe integration for payments

### 👨‍💼 **Admin Features**
- **Admin Dashboard** - Comprehensive analytics and metrics
- **Product Management** - Create, edit, delete, and feature products
- **Category Management** - Organize products into categories
- **User Management** - View and manage customer accounts
- **Order Management** - Process and track customer orders
- **Coupon System** - Create and manage discount coupons
- **Analytics** - Sales reports, user activity, and revenue tracking
- **Inventory Management** - Real-time stock tracking and low-stock alerts

### � **Security Features**
- **JWT Authentication** - Secure token-based user authentication
- **Password Encryption** - bcrypt hashing for secure password storage
- **CORS Protection** - Cross-Origin Resource Sharing configuration
- **Rate Limiting** - API abuse prevention with request throttling
- **Input Validation** - Comprehensive data sanitization and validation
- **XSS Protection** - Cross-site scripting attack prevention
- **CSRF Protection** - Cross-site request forgery mitigation
- **Helmet Security** - Security headers for production deployment
- **Environment Variables** - Secure configuration management
- **Admin Route Protection** - Role-based access control for admin features
- **SQL Injection Prevention** - MongoDB injection attack protection
- **Session Security** - Secure cookie handling and session management

### 🔧 **Technical Features**
- **RESTful API** - Well-structured backend with Express.js
- **Image Upload** - Cloudinary integration for product images
- **Payment Processing** - Stripe integration for secure payments
- **Database** - MongoDB with Mongoose ODM
- **Caching** - Redis for session management and caching
- **Error Handling** - Comprehensive error boundaries and logging
- **State Management** - Zustand for efficient state management
- **Real-time Updates** - Dynamic cart and inventory updates

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Redis (optional, for caching)
- Git

### 📥 Clone the Repository
```bash
git clone https://github.com/yourusername/e-commerce-store.git
cd e-commerce-store
```

### 🛠️ Environment Setup

#### Backend Configuration
1. Create `.env` file in the root directory:
```bash
# Database
MONGO_URI=mongodb://localhost:27017/ecommerce
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce

# JWT Secret
ACCESS_TOKEN_SECRET=your-super-secret-jwt-key-here
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Server
PORT=5000
NODE_ENV=development

# Security
ADMIN_EMAIL=admin@example.com
MASTER_API_KEY=your-master-api-key-for-admin
```

#### Frontend Configuration
1. Navigate to frontend directory and create `.env.local`:
```bash
cd frontend
```

2. Create `.env.local` file:
```bash
# API URL
VITE_API_URL=http://localhost:5000/api
```

### 📦 Installation & Setup

#### Option 1: Full Setup (Recommended)
```bash
# Install all dependencies (backend + frontend)
npm install

# Start both backend and frontend
npm run dev
```

#### Option 2: Manual Setup
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Start backend server
npm run server

# In a new terminal, start frontend
cd frontend
npm run dev
```

### 🌐 Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs (if available)

### 👨‍💼 Admin Access
1. Register a new account
2. Use the admin email configured in your `.env` file
3. The system will automatically grant admin privileges

## 🏗️ Project Structure

```
e-commerce-store/
├── backend/
│   ├── controllers/          # Route controllers
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── lib/                 # Utility libraries
│   └── server.js            # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   ├── lib/            # Utility functions
│   │   └── App.jsx         # Main app component
│   └── public/             # Static assets
├── package.json            # Root package.json
└── README.md              # This file
```

## 🛠️ Development Scripts

```bash
# Development
npm run dev                 # Start both frontend and backend
npm run server             # Start only backend
npm run client             # Start only frontend

# Production
npm run build              # Build frontend for production
npm start                  # Start production server

# Testing
npm test                   # Run tests
npm run test:watch         # Run tests in watch mode

# Linting
npm run lint               # Check code quality
npm run lint:fix           # Fix linting issues
```

## 🗄️ Database Setup

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The application will automatically create the database and collections

### MongoDB Atlas (Cloud)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Update `MONGO_URI` in your `.env` file

### Sample Data
The application includes seed data for testing:
```bash
# Seed the database with sample products and admin user
npm run seed
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove from cart

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get single order

For a complete API reference, see the [API Documentation](./API.md).

## 🚀 Deployment

### 🌐 Live Demo
The application is deployed and available at: **[https://e-commerce-store-seven-alpha.vercel.app/]**

#### 🔑 **Admin Access Credentials**
For testing admin features on the deployed website:
```
📧 Email: admin@gmail.com
🔒 Password: Admin12@^
```
> **Note**: Please change these credentials after deployment for security reasons.

#### 👤 **Demo User Account**
For testing customer features:
```
📧 Email: demo@gmail.com
🔒 Password:Demo12@^
```

### Frontend Deployment (Vercel)

1. **Fork/Clone the repository**
2. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `frontend`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```

4. **Deploy**: Vercel will automatically build and deploy

### Backend Deployment Options

#### Option 1: Railway
1. Connect your GitHub repository to Railway
2. Set root directory to `/` (project root)
3. Add environment variables in Railway dashboard
4. Deploy automatically

#### Option 2: Heroku
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set MONGO_URI=your-mongodb-uri
heroku config:set ACCESS_TOKEN_SECRET=your-secret

# Deploy
git push heroku main
```

#### Option 3: DigitalOcean App Platform
1. Connect your GitHub repository
2. Set build and run commands
3. Configure environment variables
4. Deploy

### Database Deployment
- **MongoDB Atlas** (Recommended): Managed MongoDB service
- **Railway MongoDB**: One-click MongoDB deployment
- **DigitalOcean Managed Database**: Scalable database solution

### Complete Deployment Guide
For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🛡️ Security Features

- **🔐 JWT Authentication** - Secure token-based authentication with refresh tokens
- **🔒 Password Encryption** - bcrypt hashing with salt rounds for secure password storage
- **🌐 CORS Protection** - Configurable cross-origin resource sharing policies
- **⚡ Rate Limiting** - Advanced request throttling to prevent API abuse and DDoS attacks
- **🛡️ Input Validation** - Comprehensive data sanitization and validation using express-validator
- **🚫 XSS Protection** - Cross-site scripting attack prevention with input sanitization
- **🔨 CSRF Protection** - Cross-site request forgery mitigation with secure tokens
- **🎭 Helmet Security** - Security headers middleware for production hardening
- **🔑 Environment Variables** - Secure configuration management with dotenv
- **👑 Role-Based Access** - Admin route protection with role-based authorization
- **💉 Injection Prevention** - MongoDB injection attack protection with input validation
- **🍪 Session Security** - Secure cookie handling with httpOnly and secure flags
- **📝 Audit Logging** - Security event logging for monitoring and compliance
- **🚨 Error Handling** - Secure error responses that don't leak sensitive information
- **🔍 Security Headers** - Content Security Policy, X-Frame-Options, and more
- **📊 Security Monitoring** - Real-time security event tracking and alerting

## 🧪 Testing

```bash
# Run all tests
npm test

# Run frontend tests
cd frontend && npm test

# Run backend tests
npm run test:backend

# Run with coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/e-commerce-store/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/e-commerce-store/discussions)
- **Email**: support@yourapp.com

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB for the flexible database
- Stripe for secure payment processing
- Cloudinary for image management
- All contributors and testers

## 🔄 Changelog

### v2.0.0 (Latest)
- ✅ Fixed React Rules of Hooks violations
- ✅ Improved production deployment configuration
- ✅ Enhanced error handling and recovery
- ✅ Added comprehensive cart and stock validation
- ✅ Optimized build configuration for Vercel
- ✅ Added robust environment variable handling

### v1.0.0
- 🎉 Initial release
- ✅ Complete e-commerce functionality
- ✅ Admin dashboard
- ✅ Payment integration
- ✅ Responsive design

---

**Built with ❤️ using React, Node.js, and MongoDB**
