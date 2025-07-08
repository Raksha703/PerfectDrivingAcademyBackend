import mongoose, {Schema} from 'mongoose';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
  role: { 
    type: String, 
    default: 'Candidate' 
  },
  name: { 
    type: String, 
    required: true,
    index: true
  },
  age: {
    type: Number, 
    required: true
  },
  address: {
    type: String, 
    default: ""
  },
  contactNumber: {
    type: Number, 
    required: true
  },
  vehicleToLearn: [String],
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    trim: true 
  },
  username: { 
    type: String, 
    required: true,
    index: true,
    unique: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: (true, "Password is required")
  },  
  experience: {
    type: String
  },
  specialties: {
    type: [String]
  },
  license: {
    type: String
  },
  bio: {
    type: String
  },
  avatar: {
    type: String, //cloudinary url
    default: "https://cvhrma.org/wp-content/uploads/2015/07/default-profile-photo.jpg"
  },
  refreshToken: {
    type: String
  },
  logsheet : [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Logsheet' 
  }],
  isApproved: {
    type: Boolean,
    default: false, // new users are unapproved by default
  },
}, { timestamps: true });

userSchema.pre("save", async function(next) {
  if(!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  this.password = bcrypt.hash(this.password, salt);

  next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
  return jwt.sign({
      _id : this._id,
      email: this.email,
      username: this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function(){
  return jwt.sign({
      _id : this._id,
      email: this.email,
      username: this.username
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model('User', userSchema);
