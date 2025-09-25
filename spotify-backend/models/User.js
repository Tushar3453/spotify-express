import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    required: true,
    unique: true, 
  },
  displayName: {
    type: String,
  },
  email: {
    type: String,
    lowercase: true,
  },
  profileImage: {
    type: String, 
  },
  country: {
    type: String,
  },
  product: {
    type: String, 
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  tokenExpiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", UserSchema);

export default User;
