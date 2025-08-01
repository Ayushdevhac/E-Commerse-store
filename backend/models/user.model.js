import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required:[true, "Name is required"],
  },    
  email:{
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
  },  cartItems: [
    {
        quantity: {
            type: Number,
            default: 1,
        },
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        size: {
            type: String,
            required: false // Optional, only for products that have sizes
        }
    }
  ] ,wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }
  ],
  addresses: [
    {
      type: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home'
      },
      street: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      state: {
        type: String,
        required: true,
        trim: true
      },
      zipCode: {
        type: String,
        required: true,
        trim: true
      },
      country: {
        type: String,
        required: true,
        trim: true,
        default: 'United States'
      },
      isDefault: {
        type: Boolean,
        default: false
      }
    }
  ],
  role:{
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  }
}, { timestamps: true })



userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  
  // Skip hashing if password is already hashed (e.g., in profile update)
  if (this._isPasswordAlreadyHashed) {
    delete this._isPasswordAlreadyHashed;
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  
    };

    const User=mongoose.model("User", userSchema);
export default User;