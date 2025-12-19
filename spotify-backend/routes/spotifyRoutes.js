const express = require('express');
const router = express.Router();

const searchController = require('../controllers/searchController');
const userController = require('../controllers/userController');
const playlistController = require('../controllers/playlistController');

const { protect } = require('../middleware/authMiddleware');

router.get('/search', searchController.searchTracks);
router.get('/recommendations', searchController.getRecommendations);

router.get('/top-artists', protect, userController.getTopArtists);
router.get('/top-genres', protect, userController.getTopGenres);
router.get('/top-tracks', protect, userController.getTopTracks);
router.post('/create-playlist', protect, playlistController.createPlaylist);
router.get('/top-tracks/history-dates', protect, userController.getTrackHistoryDates);


module.exports = router;

