import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        unique: true,
        trim: true,
        maxlength: [50, "Category name cannot exceed 50 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, "Description cannot exceed 200 characters"]
    },
    image: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    }
}, { timestamps: true });

// Create slug from name before saving
categorySchema.pre('save', function(next) {
    if (this.name && !this.slug) {
        this.slug = this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    next();
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
