const axios = require('axios');
const UserTopTracks = require('../models/UserTopTracks'); 

exports.createPlaylist = async (req, res) => {
    const userAccessToken = req.userToken;
    const { tracks, timeRange } = req.body; // fetching tracks from frontend

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
        return res.status(400).json({ error: 'An array of tracks is required.' });
    }

    try {
        // fetching user id
        const { data: userProfile } = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${userAccessToken}` }
        });
        const userId = userProfile.id;

        // updating tracks in database
        try {
            await UserTopTracks.findOneAndUpdate(
                { userId: userId, timeRange: timeRange }, 
                { 
                    tracks: tracks.map(t => ({
                        trackId: t.id,       
                        name: t.name,
                        rank: t.rank,
                        artist: t.artist,     
                        albumArt: t.albumArt  
                    })),
                    lastUpdated: Date.now() 
                },
                { upsert: true, new: true } // make a new document if not available
            );
            console.log('User top tracks saved to MongoDB successfully.');

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

        const { data: newPlaylist } = await axios.post(
            `https://api.spotify.com/v1/users/${userId}/playlists`,
            { name: playlistName, description, public: false },
            { headers: { 'Authorization': `Bearer ${userAccessToken}` } }
        );

        const trackUris = tracks.map(track => `spotify:track:${track.id}`);
        await axios.post(
            `https://api.spotify.com/v1/playlists/${newPlaylist.id}/tracks`,
            { uris: trackUris },
            { headers: { 'Authorization': `Bearer ${userAccessToken}` } }
        );

        res.status(201).json({
            message: "Playlist created successfully!",
            playlistUrl: newPlaylist.external_urls.spotify
        });
    
    } catch (error) {
        console.error("Error in /create-playlist:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error occured during playlist creation' });
    }
};