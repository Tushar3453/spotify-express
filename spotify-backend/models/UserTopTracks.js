const mongoose = require("mongoose");

const TrackSchema = new mongoose.Schema({
  trackId: {
    type: String,
    required: true, 
  },
  name: {
    type: String,
    required: true,
  },
  rank: { 
    type: Number, 
    required: true 
  },
  artist: { 
    type: String,
  },
  albumArt: { 
    type: String,
  },
});

const UserTopTracksSchema = new mongoose.Schema({
  userId: {
    type: String, // Spotify user ID
    required: true,
  },
  timeRange: {
    type: String,
    required: true,
    enum: ['short_term', 'medium_term', 'long_term'],
  },
  tracks: [TrackSchema], // array of simple tracks
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

UserTopTracksSchema.index({ userId: 1, timeRange: 1, lastUpdated: -1 });

const UserTopTracks = mongoose.model("UserTopTracks", UserTopTracksSchema);
module.exports = UserTopTracks;