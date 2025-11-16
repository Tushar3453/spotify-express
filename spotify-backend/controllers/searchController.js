const axios = require('axios');
const { getSpotifyToken, formatSongData, shuffleArray } = require('../utils/spotifyUtils');

exports.searchTracks = async (req, res) => {
    const { q: query } = req.query;
    if (!query) return res.status(400).json({ error: 'query parameter is required.' }); //updated .searchTracks and query.

    try {
        const token = await getSpotifyToken();
        const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`;
        const { data: spotifyResponse } = await axios.get(searchUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const items = spotifyResponse.tracks.items.map(formatSongData).filter(Boolean); // .filter removes any invalid or null results
        res.status(200).json(items);
    } catch (error) {
        console.error('Error in /api/search:', error.message);
        res.status(500).json({ error: 'Error occured while searching for tracks.' });
    }
};

exports.getRecommendations = async (req, res) => {

    const { trackName, artistName, artistId, releaseYear } = req.query;
    if (!trackName || !artistName || !artistId || !releaseYear) {
        return res.status(400).json({ error: 'trackName, artistName, artistId, and releaseYear are required.' });
    }

    try {
        let songQueries = [];
        const primaryArtist = artistName.split(',')[0].trim();

        const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${encodeURIComponent(primaryArtist)}&track=${encodeURIComponent(trackName)}&limit=50&api_key=${process.env.LASTFM_API_KEY}&format=json`;
        try {
            const { data: fmData } = await axios.get(lastFmUrl);
            // ?. avoids runtime errors if anything is missing
            if (fmData.similartracks?.track?.length > 0) { 
                songQueries = fmData.similartracks.track.map(t => ({ songName: t.name, artistName: t.artist.name }));
            }
        } catch (fmError) { console.log("Last.fm request failed."); }

        if (songQueries.length === 0) return res.status(200).json([]);
        
        const spotifyAccessToken = await getSpotifyToken();
        const authHeader = { Authorization: `Bearer ${spotifyAccessToken}` }; 

        const promises = songQueries.map(q => 
            axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(`track:"${q.songName}" artist:"${q.artistName}"`)}&type=track&limit=1`, { headers: authHeader })
                 .then(r => r.data?.tracks?.items?.[0] || null)
                 .catch(() => null) 
        );
        
        const results = await Promise.all(promises);
        const recommendations = results.filter(Boolean).map(formatSongData).filter(Boolean);
        
        res.status(200).json(shuffleArray(recommendations).slice(0, 10));

    } catch (error) {
        console.error("Error in /recommendations:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error occured while fetching Recommendations' });
    }
};

