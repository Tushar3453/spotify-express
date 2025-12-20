const axios = require('axios');
const playlistController = require('../../controllers/playlistController');
const UserTopTracks = require('../../models/UserTopTracks');

// Mock dependencies
jest.mock('axios');
jest.mock('../../models/UserTopTracks', () => ({
    collection: { dropIndex: jest.fn().mockResolvedValue({}) },
    create: jest.fn(),
}));

describe('Playlist Controller - createPlaylist', () => {
    let req, res;

    beforeEach(() => {
        req = {
            userToken: 'mock_access_token',
            body: {
                timeRange: 'short_term',
                tracks: [
                    { id: 't1', name: 'Track 1', rank: 1, artist: 'Art 1', albumArt: 'url1' },
                    { id: 't2', name: 'Track 2', rank: 2, artist: 'Art 2', albumArt: 'url2' }
                ]
            },
            io: { emit: jest.fn() } // Mock Socket.io
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('should return 400 if tracks array is missing', async () => {
        req.body.tracks = [];
        await playlistController.createPlaylist(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'An array of tracks is required.' });
    });

    it('should create a playlist and save snapshot successfully', async () => {
        // 1. Mock User Profile Fetch
        axios.get.mockResolvedValue({ data: { id: 'user_123' } });

        // 2. Mock Playlist Creation on Spotify
        const mockPlaylist = { id: 'playlist_abc', external_urls: { spotify: 'http://playlist.url' } };
        axios.post.mockImplementation((url) => {
            if (url.includes('/playlists')) return Promise.resolve({ data: mockPlaylist });
            if (url.includes('/tracks')) return Promise.resolve({ data: {} });
            return Promise.reject(new Error('Unknown URL'));
        });

        // 3. Mock Database Creation
        UserTopTracks.create.mockResolvedValue(true);

        await playlistController.createPlaylist(req, res);

        // Assertions
        
        // Check if User ID was fetched (CORRECTED URL HERE: .../2 instead of .../9)
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('https://api.spotify.com/v1/me'), expect.any(Object));

        // Check if DB save was called
        expect(UserTopTracks.create).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user_123',
            timeRange: 'short_term',
            tracks: expect.arrayContaining([
                expect.objectContaining({ trackId: 't1' })
            ])
        }));

        // Check if Spotify Playlist was created
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/playlists'),
            expect.objectContaining({ name: expect.stringContaining('Last 4 Weeks') }),
            expect.any(Object)
        );

        // Check Socket emission
        expect(req.io.emit).toHaveBeenCalledWith('playlist_created', expect.objectContaining({
            link: 'http://playlist.url'
        }));

        // Check Final Response
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: "Playlist created successfully!",
            playlistUrl: 'http://playlist.url'
        });
    });

    it('should handle errors during playlist creation', async () => {
        // Mock failure at first step (User Profile)
        axios.get.mockRejectedValue(new Error('Network Error'));

        await playlistController.createPlaylist(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Error occured during playlist creation' });
    });
});