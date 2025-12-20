const axios = require('axios');
const { getSpotifyToken, formatSongData, shuffleArray } = require('../../utils/spotifyUtils');

// Mock Axios
jest.mock('axios');

describe('Spotify Utils', () => {
    
    // Clear mocks after each test
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSpotifyToken', () => {
        beforeAll(() => {
            process.env.SPOTIFY_CLIENT_ID = 'test_id';
            process.env.SPOTIFY_CLIENT_SECRET = 'test_secret';
        });

        it('should fetch a new token if none exists', async () => {
            const mockResponse = {
                data: {
                    access_token: 'new_mock_token',
                    expires_in: 3600
                }
            };
            axios.mockResolvedValue(mockResponse);

            const token = await getSpotifyToken();

            expect(axios).toHaveBeenCalledWith(expect.objectContaining({
                method: 'post',
                url: 'https://accounts.spotify.com/api/token', // Matches your file URL
            }));
            expect(token).toBe('new_mock_token');
        });

        it('should return cached token if valid', async () => {
            // Call it once to set the cache from the previous test or a new setup
            // For simplicity, we assume the previous test set the state, 
            // but in unit tests, it's safer to rely on internal state logic 
            // or re-mock for a fresh scenario if we could reset modules.
            // Since we can't easily reset the module-level variable `spotifyToken` 
            // without Jest configuration for module resetting, we will test the "fetch" again 
            // or assume the previous test succeeded.
            
            // To properly test the "Time" logic, we would usually mock Date.now()
            const token = await getSpotifyToken(); 
            expect(token).toBe('new_mock_token');
            expect(axios).not.toHaveBeenCalled(); // Should not call API again
        });
    });

    describe('formatSongData', () => {
        it('should return null if item data is incomplete', () => {
            const result = formatSongData({});
            expect(result).toBeNull();
        });

        it('should format valid song data correctly', () => {
            const mockItem = {
                id: '123',
                name: 'Test Song',
                artists: [{ name: 'Artist A', id: 'a1' }, { name: 'Artist B', id: 'b1' }],
                album: {
                    images: [{ url: 'http://image.url' }],
                    release_date: '2023-01-01'
                },
                external_urls: { spotify: 'http://spotify.url' }
            };

            const result = formatSongData(mockItem);

            expect(result).toEqual({
                id: '123',
                name: 'Test Song',
                artist: 'Artist A, Artist B',
                artistId: 'a1',
                albumArt: 'http://image.url',
                spotifyUrl: 'http://spotify.url',
                releaseYear: 2023
            });
        });
    });

    describe('shuffleArray', () => {
        it('should contain the same elements after shuffle', () => {
            const array = [1, 2, 3, 4, 5];
            const originalLength = array.length;
            const shuffled = shuffleArray([...array]); // Send a copy

            expect(shuffled).toHaveLength(originalLength);
            expect(shuffled).toEqual(expect.arrayContaining(array));
        });
    });
});