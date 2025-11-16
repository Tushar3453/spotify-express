const axios = require('axios');
const UserTopTracks = require('../models/UserTopTracks');

exports.getTopArtists = async (req, res) => {
    const userAccessToken = req.userToken;
    const { time_range = 'medium_term' } = req.query;

    try {
        const url = `https://api.spotify.com/v1/me/top/artists?time_range=${time_range}&limit=21`;
        const { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${userAccessToken}` } });
        const artists = data.items.map((item, i) => ({
            rank: i + 1,
            id: item.id,
            name: item.name,
            imageUrl: item.images[0]?.url,
            spotifyUrl: item.external_urls.spotify,
        }));
        res.status(200).json(artists);
    } catch (error) {
        console.error("Error in /top-artists:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error occured while fetching top artists.' });
    }
};

exports.getTopGenres = async (req, res) => {
    const userAccessToken = req.userToken;
    const { time_range = 'medium_term' } = req.query;

    try {
        const url = `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${time_range}`;
        const { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${userAccessToken}` } });
        if (!data.items?.length) return res.status(200).json([]);

        const genreCounts = data.items.flatMap(a => a.genres).reduce((acc, genre) => {
            acc[genre] = (acc[genre] || 0) + 1;
            return acc;
        }, {});

        const sortedGenres = Object.entries(genreCounts)
            .sort(([,a],[,b]) => b-a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
        res.status(200).json(sortedGenres);
    } catch (error) {
        console.error("Error in /top-genres:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error occured while fetching top genres.' });
    }
};

exports.getTopTracks = async (req, res) => {
    const userAccessToken = req.userToken;
    const { time_range = 'medium_term' } = req.query;
    const redisClient = req.redisClient; 

    let userId;
    try {
        const { data: userProfile } = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${userAccessToken}` }
        });
        userId = userProfile.id;

    } catch (e) {
        console.error("Error fetching user profile:", e.message);
        return res.status(500).json({ error: 'Failed to get user profile.' });
    }

    const cacheKey = `user:${userId}:top-tracks:${time_range}`;

    try {
        // check in redis
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            // (CACHE HIT) - Data found
            console.log('CACHE HIT:', cacheKey);
            return res.status(200).json(JSON.parse(cachedData));
        }

        // (CACHE MISS) - Data not found
        console.log('CACHE MISS:', cacheKey);
        
        const oldData = await UserTopTracks.findOne({ userId: userId, timeRange: time_range });
        
        const oldTracksMap = new Map();
        if (oldData) {
            oldData.tracks.forEach(track => {
                oldTracksMap.set(track.trackId, track.rank);
            });
        }

        const url = `https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=50`;
        const { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${userAccessToken}` } });

        const newTracks = data.items.map((item, i) => {
            const newRank = i + 1;
            const oldRank = oldTracksMap.get(item.id);
            let rankChange = 'new'; 

            if (oldRank) {
                if (newRank < oldRank) rankChange = 'up';
                else if (newRank > oldRank) rankChange = 'down';
                else rankChange = 'same';
            }

            return {
                rank: newRank,
                id: item.id,
                name: item.name,
                artist: item.artists.map((a) => a.name).join(', '),
                albumArt: item.album.images[0]?.url,
                spotifyUrl: item.external_urls.spotify,
                rankChange: rankChange,
            };
        });

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(newTracks));
        console.log('CACHE SET:', cacheKey);

        res.status(200).json(newTracks);

    } catch (error) {
        console.error("Error in /top-tracks:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error occured while fetching top tracks.' });
    }
};