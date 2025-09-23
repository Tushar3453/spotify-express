const axios = require('axios');

let spotifyToken = null;
let tokenExpiryTime = 0;

const getSpotifyToken = async () => {
    if (spotifyToken && Date.now() < tokenExpiryTime) {
        return spotifyToken;
    }
    try {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            },
            data: 'grant_type=client_credentials'
        });
        spotifyToken = response.data.access_token;
        tokenExpiryTime = Date.now() + (response.data.expires_in - 300) * 1000;
        console.log("Successfully fetched new server token!");
        return spotifyToken;
    } catch (error) {
        console.error('Error during token fetching: ', error.response ? error.response.data : error.message);
        throw new Error('Unable to authenticate with Spotify.');
    }
};

const formatSongData = (item) => {
    if (!item || !item.album || !item.artists || !item.artists.length || !item.album.release_date) return null;
    return {
        id: item.id, name: item.name, artist: item.artists.map(a => a.name).join(', '), artistId: item.artists[0].id,
        albumArt: item.album.images[0]?.url, spotifyUrl: item.external_urls.spotify,
        releaseYear: parseInt(item.album.release_date.split('-')[0]),
    };
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = {
    getSpotifyToken,
    formatSongData,
    shuffleArray
};
