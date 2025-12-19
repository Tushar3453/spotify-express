const axios = require('axios');
const UserTopTracks = require('../models/UserTopTracks'); 

exports.createPlaylist = async (req, res) => {
    const userAccessToken = req.userToken;
    const { tracks, timeRange } = req.body; 

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
        return res.status(400).json({ error: 'An array of tracks is required.' });
    }

    try {
        // 1. Fetching user id
        const { data: userProfile } = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${userAccessToken}` }
        });
        const userId = userProfile.id;

        // 2. Saving Snapshot in Database
        try {
            await UserTopTracks.collection.dropIndex('userId_1_timeRange_1').catch(() => {});
            await UserTopTracks.create({
                userId: userId,
                timeRange: timeRange,
                tracks: tracks.map(t => ({
                    trackId: t.id,       
                    name: t.name,
                    rank: t.rank,
                    artist: t.artist,     
                    albumArt: t.albumArt  
                })),
                lastUpdated: Date.now() 
            });
            console.log('User top tracks snapshot saved to MongoDB.');

        } catch (dbError) {
            console.error("Could not save tracks to MongoDB:", dbError.message);
        }

        const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        let titleRangeText = "All Time", descriptionRangeText = "of All Time";
        if (timeRange === 'short_term') {
            titleRangeText = "Last 4 Weeks"; descriptionRangeText = "from the Last 4 Weeks";
        } else if (timeRange === 'medium_term') {
            titleRangeText = "Last 6 Months"; descriptionRangeText = "from the Last 6 Months";
        }
        
        const playlistName = `My Top Tracks ${date} (${titleRangeText})`;
        const description = `Your favorite tracks ${descriptionRangeText}. Created by SoundSphere.`;

        // 3. Create Playlist on Spotify
        const { data: newPlaylist } = await axios.post(
            `https://api.spotify.com/v1/users/${userId}/playlists`, 
            { name: playlistName, description, public: false },
            { headers: { 'Authorization': `Bearer ${userAccessToken}` } }
        );

        // 4. Add Tracks to Playlist 
        const trackUris = tracks.map(track => `spotify:track:${track.id}`);
        await axios.post(
            `https://api.spotify.com/v1/playlists/${newPlaylist.id}/tracks`, // Added $ before newPlaylist.id
            { uris: trackUris },
            { headers: { 'Authorization': `Bearer ${userAccessToken}` } }
        );

        // WEB SOCKET
        if (req.io) {
            req.io.emit('playlist_created', {
                message: `New Playlist Created: "${playlistName}"`,
                link: newPlaylist.external_urls.spotify
            });
            console.log("Socket event 'playlist_created' emitted.");
        }

        res.status(201).json({
            message: "Playlist created successfully!",
            playlistUrl: newPlaylist.external_urls.spotify
        });
    
    } catch (error) {
        console.error("Error in /create-playlist:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error occured during playlist creation' });
    }
};