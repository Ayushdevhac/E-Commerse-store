import validator from 'validator';
import xss from 'xss';
import { body, validationResult } from 'express-validator';

// Advanced input sanitization middleware
export const sanitizeInput = (req, res, next) => {
    // Sanitize all string inputs
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove XSS attempts
                obj[key] = xss(obj[key]);
                // Trim whitespace
                obj[key] = obj[key].trim();
                // Remove null bytes
                obj[key] = obj[key].replace(/\0/g, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

// Enhanced validation chains
export const validateSignup = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
        .custom(async (email) => {
            // Check for disposable email domains
            const disposableDomains = [
                '10minutemail.com', 'tempmail.org', 'guerrillamail.com'
            ];
            const domain = email.split('@')[1];
            if (disposableDomains.includes(domain)) {
                throw new Error('Disposable email addresses are not allowed');
            }
            return true;
        }),
    
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
    
    handleValidationErrors
];

export const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

export const validateProduct = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Product name must be between 1 and 200 characters'),
    
    body('description')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters'),
    
    body('price')
        .isFloat({ min: 0.01, max: 999999.99 })
        .withMessage('Price must be a valid amount between 0.01 and 999999.99'),
    
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required')
        .isLength({ max: 50 })
        .withMessage('Category name cannot exceed 50 characters'),
    
    body('countInStock')
        .isInt({ min: 0 })
        .withMessage('Stock count must be a non-negative integer'),
    
    handleValidationErrors
];

export const validateCategory = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Category name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z0-9\s\-_]+$/)
        .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and underscores'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    
    handleValidationErrors
];

export const validateOrder = [
    body('shippingAddress.fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ max: 100 })
        .withMessage('Full name cannot exceed 100 characters'),
    
    body('shippingAddress.address')
        .trim()
        .notEmpty()
        .withMessage('Address is required')
        .isLength({ max: 200 })
        .withMessage('Address cannot exceed 200 characters'),
    
    body('shippingAddress.city')
        .trim()
        .notEmpty()
        .withMessage('City is required')
        .isLength({ max: 50 })
        .withMessage('City cannot exceed 50 characters'),
    
    body('shippingAddress.postalCode')
        .trim()
        .notEmpty()
        .withMessage('Postal code is required')
        .matches(/^[A-Z0-9\s\-]{3,10}$/i)
        .withMessage('Invalid postal code format'),
    
    body('shippingAddress.country')
        .trim()
        .notEmpty()
        .withMessage('Country is required')
        .isLength({ max: 50 })
        .withMessage('Country cannot exceed 50 characters'),
    
    handleValidationErrors
];

export const validateReview = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    
    body('comment')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Comment cannot exceed 1000 characters'),
    
    handleValidationErrors
];

export const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    
    body('newPassword')
        .isLength({ min: 8, max: 128 })
        .withMessage('New password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
    
    handleValidationErrors
];

export const validateProfileUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters')
        .custom((value) => {
            // Allow letters, spaces, hyphens, apostrophes, periods, and common unicode characters
            if (value && !/^[\p{L}\s\-'\.]+$/u.test(value)) {
                throw new Error('Name contains invalid characters');
            }
            return true;
        }),
    
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    
    body('currentPassword')
        .optional()
        .isString()
        .withMessage('Current password must be a string'),
    
    body('newPassword')
        .optional()
        .isLength({ min: 6, max: 128 })
        .withMessage('New password must be between 6 and 128 characters')
        .custom((value, { req }) => {
            // Only validate if newPassword is provided
            if (value && req.body.currentPassword === undefined) {
                throw new Error('Current password is required when changing password');
            }
            return true;
        }),
    
    handleValidationErrors
];

// Handle validation errors
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
        }));
        
        return res.status(400).json({
            message: 'Validation failed',
            errors: errorMessages,
            code: 'VALIDATION_ERROR'
        });
    }
    
    next();
}

// Legacy validation for backward compatibility
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// File upload validation
export const validateFileUpload = (req, res, next) => {
    if (!req.file && !req.files) {
        return next();
    }

    const file = req.file || (req.files && req.files[0]);
    
    if (file) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return res.status(400).json({
                message: 'File size cannot exceed 10MB',
                code: 'FILE_TOO_LARGE'
            });
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                message: 'Only JPEG, PNG, WebP, and GIF images are allowed',
                code: 'INVALID_FILE_TYPE'
            });
        }

        // Check for malicious file headers
        const buffer = file.buffer || Buffer.from('');
        const header = buffer.slice(0, 10).toString('hex');
        
        const validHeaders = {
            'ffd8ff': 'jpeg',
            '89504e47': 'png',
            '52494646': 'webp',
            '47494638': 'gif'
        };

        const isValidHeader = Object.keys(validHeaders).some(validHeader => 
            header.startsWith(validHeader)
        );

        if (!isValidHeader) {
            return res.status(400).json({
                message: 'Invalid file format detected',
                code: 'INVALID_FILE_HEADER'
            });
        }
    }

    next();
};
