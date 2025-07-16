import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
},  
description: {
    type: String,
    required: [true, "Product description is required"],
},  
price:{
    type: Number,
    required: [true, "Product price is required"],
    min: [0, "Price must be a positive number"],
},
image: {
    type: String,
    required: [true, "Product image is required"],
}, 
category: {
    type: String,
    required: [true, "Product category is required"],
},
sizes: {
    type: [String],
    default: [],
    validate: {
        validator: function(sizes) {
            // Allow empty array or valid size values
            if (!sizes || sizes.length === 0) return true;
            const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
            return sizes.every(size => validSizes.includes(size.toString().toUpperCase()));
        },
        message: 'Invalid size value. Supported sizes: XS, S, M, L, XL, XXL, XXXL, or numeric sizes'
    }
},
stock: {
    type: mongoose.Schema.Types.Mixed, // Allow both Map and Number
    default: function() {
        return this.sizes && this.sizes.length > 0 ? new Map() : 50;
    },
    validate: {
        validator: function(stock) {
            // If no sizes specified, stock should be a number
            if (!this.sizes || this.sizes.length === 0) {
                return typeof stock === 'number' && stock >= 0;
            }
            // If sizes specified, stock should be a Map with entries for each size
            if (!stock || typeof stock.get !== 'function') return false;
            for (let size of this.sizes) {
                const sizeStock = stock.get(size);
                if (sizeStock === undefined || sizeStock < 0) {
                    return false;
                }
            }
            return true;
        },
        message: 'Stock must be a positive number for products without sizes, or a map with positive values for each size'
    }
},
isFeatured: {
    type: Boolean,
    default: false,
},
averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
},
totalReviews: {
    type: Number,
    default: 0,
    min: 0,
}
}, {timestamps: true});

// Index for better query performance
productSchema.index({ category: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ isFeatured: 1 });

// Virtual for rounded rating
productSchema.virtual('roundedRating').get(function() {
    return Math.round(this.averageRating * 10) / 10;
});

const Product = mongoose.model("Product", productSchema);
export default Product;