const axios = require('axios');
const { getTopGenres } = require('../../controllers/userController');

// Mock Axios
jest.mock('axios');

describe('User Controller - getTopGenres', () => {
    let req, res;

    beforeEach(() => {
        req = {
            userToken: 'mock_token',
            query: { time_range: 'medium_term' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('should return a sorted list of top genres', async () => {
        // Mock Spotify API Response
        const mockSpotifyResponse = {
            data: {
                items: [
                    { genres: ['pop', 'rock'] },
                    { genres: ['pop', 'jazz'] },
                    { genres: ['pop'] },
                    { genres: ['rock'] }
                ]
            }
        };
        // pop: 3, rock: 2, jazz: 1

        axios.get.mockResolvedValue(mockSpotifyResponse);

        await getTopGenres(req, res);

        expect(axios.get).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        
        // Check if logic correctly counted and sorted genres
        expect(res.json).toHaveBeenCalledWith([
            { name: 'pop', count: 3 },
            { name: 'rock', count: 2 },
            { name: 'jazz', count: 1 }
        ]);
    });

    it('should return empty array if no items found', async () => {
        axios.get.mockResolvedValue({ data: { items: [] } });

        await getTopGenres(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle API errors gracefully', async () => {
        axios.get.mockRejectedValue(new Error('API Failed'));

        await getTopGenres(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Error occured while fetching top genres.' });
    });
});