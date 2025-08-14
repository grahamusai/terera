/**
 * Recommendation Service Tests
 * Tests for mood-based music recommendation functionality
 */

import { recommendationService } from '../services/recommendationService.js';
import { MOOD_MAPPINGS } from '../config/moodMappings.js';

// Mock fetch for testing
global.fetch = jest.fn();

describe('RecommendationService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('mapMoodToAudioFeatures', () => {
    test('should map exact mood matches correctly', () => {
      const features = recommendationService.mapMoodToAudioFeatures('happy');
      expect(features).toEqual(MOOD_MAPPINGS.happy);
    });

    test('should handle case insensitive mood matching', () => {
      const features = recommendationService.mapMoodToAudioFeatures('HAPPY');
      expect(features).toEqual(MOOD_MAPPINGS.happy);
    });

    test('should handle partial mood matches', () => {
      const features = recommendationService.mapMoodToAudioFeatures('feeling sad');
      expect(features).toEqual(MOOD_MAPPINGS.sad);
    });

    test('should return default calm mood for unknown moods', () => {
      const features = recommendationService.mapMoodToAudioFeatures('unknown_mood');
      expect(features).toEqual(MOOD_MAPPINGS.calm);
    });

    test('should handle empty mood input', () => {
      const features = recommendationService.mapMoodToAudioFeatures('');
      expect(features).toEqual(MOOD_MAPPINGS.calm);
    });
  });

  describe('createMoodSearchQuery', () => {
    test('should create appropriate search query for known moods', () => {
      const query = recommendationService.createMoodSearchQuery('happy');
      expect(query).toBe('happy upbeat cheerful positive');
    });

    test('should fallback to mood itself for unknown moods', () => {
      const query = recommendationService.createMoodSearchQuery('mysterious');
      expect(query).toBe('mysterious');
    });

    test('should handle case insensitive mood search', () => {
      const query = recommendationService.createMoodSearchQuery('SAD');
      expect(query).toBe('sad melancholy blues emotional');
    });
  });

  describe('extractAlbumsFromTracks', () => {
    test('should extract unique albums from track list', () => {
      const tracks = [
        {
          album: { id: '1', name: 'Album 1', artist: 'Artist 1' }
        },
        {
          album: { id: '2', name: 'Album 2', artist: 'Artist 2' }
        },
        {
          album: { id: '1', name: 'Album 1', artist: 'Artist 1' } // Duplicate
        }
      ];

      const albums = recommendationService.extractAlbumsFromTracks(tracks);
      expect(albums).toHaveLength(2);
      expect(albums[0].id).toBe('1');
      expect(albums[1].id).toBe('2');
    });

    test('should handle empty track list', () => {
      const albums = recommendationService.extractAlbumsFromTracks([]);
      expect(albums).toEqual([]);
    });

    test('should handle tracks without albums', () => {
      const tracks = [
        { name: 'Track 1' },
        { album: null },
        { album: { id: '1', name: 'Album 1' } }
      ];

      const albums = recommendationService.extractAlbumsFromTracks(tracks);
      expect(albums).toHaveLength(1);
      expect(albums[0].id).toBe('1');
    });
  });

  describe('getRecommendationsByMood', () => {
    test('should successfully get recommendations for a mood', async () => {
      // Mock successful API responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            tracks: [
              { id: '1', name: 'Happy Song', album: { id: 'a1', name: 'Happy Album' } }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            tracks: { items: [{ id: '2', name: 'Search Song' }] },
            albums: { items: [{ id: 'a2', name: 'Search Album' }] }
          })
        });

      const result = await recommendationService.getRecommendationsByMood('happy');

      expect(result.mood).toBe('happy');
      expect(result.audioFeatures).toEqual(MOOD_MAPPINGS.happy);
      expect(result.recommendations.tracks).toHaveLength(1);
      expect(result.searchResults.tracks).toHaveLength(1);
      expect(result.searchResults.albums).toHaveLength(1);
    });

    test('should handle API errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('API Error'));

      await expect(
        recommendationService.getRecommendationsByMood('happy')
      ).rejects.toThrow('Failed to get recommendations: API Error');
    });

    test('should handle non-ok API responses', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' })
      });

      await expect(
        recommendationService.getRecommendationsByMood('happy')
      ).rejects.toThrow('Failed to get recommendations: API Error');
    });
  });

  describe('getFallbackRecommendations', () => {
    test('should return fallback recommendations with error message', () => {
      const fallback = recommendationService.getFallbackRecommendations('happy');
      
      expect(fallback.mood).toBe('happy');
      expect(fallback.audioFeatures).toEqual(MOOD_MAPPINGS.happy);
      expect(fallback.recommendations.tracks).toEqual([]);
      expect(fallback.recommendations.albums).toEqual([]);
      expect(fallback.error).toBe('Unable to fetch recommendations. Please try again later.');
    });
  });
});

// Integration test helper
export async function testRecommendationFlow() {
  console.log('🎵 Testing Recommendation Service...');
  
  try {
    // Test mood mapping
    const audioFeatures = recommendationService.mapMoodToAudioFeatures('happy');
    console.log('✅ Mood mapping works:', audioFeatures);
    
    // Test search query creation
    const searchQuery = recommendationService.createMoodSearchQuery('sad');
    console.log('✅ Search query creation works:', searchQuery);
    
    // Test album extraction
    const testTracks = [
      { album: { id: '1', name: 'Test Album' } },
      { album: { id: '2', name: 'Another Album' } }
    ];
    const albums = recommendationService.extractAlbumsFromTracks(testTracks);
    console.log('✅ Album extraction works:', albums.length, 'albums');
    
    console.log('🎉 All recommendation service tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Recommendation service test failed:', error);
    return false;
  }
}