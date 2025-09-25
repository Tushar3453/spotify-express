import mongoose from "mongoose";

const TrackSchema = new mongoose.Schema({
  trackId: {
    type: String,
    required: true, 
  },
  name: {
    type: String,
    required: true,
  },
  artists: [
    {
      id: String,
      name: String,
    },
  ],
  album: {
    id: String,
    name: String,
    imageUrl: String,
  },
  previewUrl: String,
  durationMs: Number,
  popularity: Number,
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const UserTopTracksSchema = new mongoose.Schema({
  userId: {
    type: String, // Spotify user ID
    required: true,
    unique: true,
  },
  tracks: [TrackSchema], // array of tracks
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const UserTopTracks = mongoose.model("UserTopTracks", UserTopTracksSchema);

export default UserTopTracks;
