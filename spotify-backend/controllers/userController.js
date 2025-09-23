const axios = require('axios');

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

    try {
        const url = `https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=50`;
        const { data } = await axios.get(url, { headers: { 'Authorization': `Bearer ${userAccessToken}` } });
        const tracks = data.items.map((item, i) => ({
            rank: i + 1,
            id: item.id,
            name: item.name,
            artist: item.artists.map((a) => a.name).join(', '),
            albumArt: item.album.images[0]?.url,
            spotifyUrl: item.external_urls.spotify,
        }));
        res.status(200).json(tracks);
    } catch (error) {
        console.error("Error in /top-tracks:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error occured while fetching top tracks.' });
    }
};


