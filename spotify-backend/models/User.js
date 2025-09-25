import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    required: true,
    unique: true, // Spotify ke user ka unique ID
  },
  displayName: {
    type: String,
  },
  email: {
    type: String,
    lowercase: true,
  },
  profileImage: {
    type: String, // Spotify profile picture URL
  },
  country: {
    type: String,
  },
  product: {
    type: String, // "premium" ya "free"
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
