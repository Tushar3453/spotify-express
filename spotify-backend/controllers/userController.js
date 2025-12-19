const axios = require('axios');
const UserTopTracks = require('../models/UserTopTracks');

const getUserProfile = async (accessToken) => {
    const { data } = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return data;
};

exports.getTopArtists = async (req, res) => {
    const accessToken = req.userToken;
    const { time_range = 'medium_term' } = req.query;

    try {
        const endpoint = 'https://api.spotify.com/v1/me/top/artists';
        const query = `time_range=${time_range}&limit=21`;
        const { data } = await axios.get(`${endpoint}?${query}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const artists = data.items.map((artist, index) => ({
            rank: index + 1,
            id: artist.id,
            name: artist.name,
            imageUrl: artist.images[0]?.url,
            spotifyUrl: artist.external_urls.spotify
        }));

        return res.status(200).json(artists);
    } catch (error) {
        console.error(
            'Error in /top-artists:',
            error.response ? error.response.data : error.message
        );
        return res
            .status(500)
            .json({ error: 'Error occured while fetching top artists.' });
    }
};

exports.getTopGenres = async (req, res) => {
    const accessToken = req.userToken;
    const { time_range = 'medium_term' } = req.query;

    try {
        const endpoint = 'https://api.spotify.com/v1/me/top/artists';
        const query = `limit=50&time_range=${time_range}`;
        const { data } = await axios.get(`${endpoint}?${query}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!Array.isArray(data.items) || data.items.length === 0) {
            return res.status(200).json([]);
        }

        const genreCounts = {};
        for (const artist of data.items) {
            for (const genre of artist.genres) {
                genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            }
        }

        const sortedGenres = Object.entries(genreCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        return res.status(200).json(sortedGenres);
    } catch (error) {
        console.error(
            'Error in /top-genres:',
            error.response ? error.response.data : error.message
        );
        return res
            .status(500)
            .json({ error: 'Error occured while fetching top genres.' });
    }
};

exports.getTopTracks = async (req, res) => {
    const accessToken = req.userToken;
    const { time_range = 'medium_term', historyId } = req.query;
    const redisClient = req.redisClient;

    // if history id is present
    if (historyId) {
        try {
            const historicalData = await UserTopTracks.findById(historyId);
            if (!historicalData) {
                return res.status(404).json({ error: 'History record not found' });
            }
            const formattedTracks = historicalData.tracks.map(t => ({
                id: t.trackId,
                name: t.name,
                rank: t.rank,
                artist: t.artist,
                albumArt: t.albumArt,
                spotifyUrl: `https://open.spotify.com/track/${t.trackId}`,
                rankChange: 'same' //default     
            }));
            return res.status(200).json(formattedTracks);
        } catch (e) {
            console.error('Error fetching history:', e);
            return res.status(500).json({ error: 'Error fetching history data' });
        }
    }

    // default  
    let userId;
    try {
        const profile = await getUserProfile(accessToken);
        userId = profile.id;
    } catch (e) {
        console.error('Error fetching user profile:', e.message);
        return res.status(500).json({ error: 'Failed to get user profile.' });
    }

    const cacheKey = `user:${userId}:top-tracks:${time_range}`;

    try {
        const cachedValue = await redisClient.get(cacheKey);
        if (cachedValue) {
            console.log('CACHE HIT:', cacheKey);
            return res.status(200).json(JSON.parse(cachedValue));
        }
        console.log('CACHE MISS:', cacheKey);

        const previousEntry = await UserTopTracks.findOne({
            userId,
            timeRange: time_range
        }).sort({ lastUpdated: -1 });

        const previousRanks = previousEntry
            ? previousEntry.tracks.reduce((map, track) => {
                map.set(track.trackId, track.rank);
                return map;
            }, new Map())
            : new Map();

        const endpoint = 'https://api.spotify.com/v1/me/top/tracks';
        const query = `time_range=${time_range}&limit=50`;
        const { data } = await axios.get(`${endpoint}?${query}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const tracks = data.items.map((item, index) => {
            const currentRank = index + 1;
            const previousRank = previousRanks.get(item.id);
            let rankChange = 'new';

            if (previousRank) {
                if (currentRank < previousRank) {
                    rankChange = 'up';
                } else if (currentRank > previousRank) {
                    rankChange = 'down';
                } else {
                    rankChange = 'same';
                }
            }

            return {
                rank: currentRank,
                id: item.id,
                name: item.name,
                artist: item.artists.map((artist) => artist.name).join(', '),
                albumArt: item.album.images[0]?.url,
                spotifyUrl: item.external_urls.spotify,
                rankChange
            };
        });


        await redisClient.setEx(cacheKey, 3600, JSON.stringify(tracks));
        console.log('CACHE SET:', cacheKey);

        return res.status(200).json(tracks);
    } catch (error) {
        console.error(
            'Error in /top-tracks:',
            error.response ? error.response.data : error.message
        );
        return res
            .status(500)
            .json({ error: 'Error occured while fetching top tracks.' });
    }
};

exports.getTrackHistoryDates = async (req, res) => {
    const accessToken = req.userToken;
    const { time_range = 'medium_term' } = req.query;

    try {
        // get user id
        const profile = await getUserProfile(accessToken);
        const userId = profile.id;

        // get dates and id from db
        const history = await UserTopTracks.find(
            { userId, timeRange: time_range },
            { lastUpdated: 1, _id: 1 }
        ).sort({ lastUpdated: -1 });

        return res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching history dates:', error.message);
        return res.status(500).json({ error: 'Failed to fetch history dates' });
    }
};
