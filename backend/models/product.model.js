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