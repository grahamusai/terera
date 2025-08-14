/**
 * Music Recommendation Service
 * Handles mood-based music recommendations using Spotify API
 */

import { MOOD_MAPPINGS } from '../config/moodMappings.js';

class RecommendationService {
  /**
   * Get music recommendations based on mood
   * @param {string} mood - User's mood input
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Recommendations with albums and tracks
   */
  async getRecommendationsByMood(mood, options = {}) {
    try {
      const { limit = 20 } = options;
      
      // Map mood to audio features
      const audioFeatures = this.mapMoodToAudioFeatures(mood);
      
      // Use search-only approach (more reliable than recommendations API)
      const searchResults = await this.searchByMood(mood, {
        types: ['track', 'album'],
        limit
      });

      // Format results
      return {
        mood,
        audioFeatures,
        recommendations: {
          tracks: searchResults.tracks?.items || [],
          albums: searchResults.albums?.items || []
        },
        searchResults: {
          tracks: searchResults.tracks?.items || [],
          albums: searchResults.albums?.items || []
        }
      };

    } catch (error) {
      console.error('Error getting recommendations by mood:', error);
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }
  }

  /**
   * Map mood to Spotify audio features
   * @param {string} mood - User's mood input
   * @returns {Object} Audio features object
   */
  mapMoodToAudioFeatures(mood) {
    const normalizedMood = mood.toLowerCase().trim();
    
    // Check for exact matches first
    if (MOOD_MAPPINGS[normalizedMood]) {
      return MOOD_MAPPINGS[normalizedMood];
    }

    // Check for partial matches
    for (const [key, features] of Object.entries(MOOD_MAPPINGS)) {
      if (normalizedMood.includes(key) || key.includes(normalizedMood)) {
        return features;
      }
    }

    // Default to neutral mood if no match found
    return MOOD_MAPPINGS.calm || {
      valence: 0.5,
      energy: 0.5,
      danceability: 0.5
    };
  }

  /**
   * Get recommendations from Spotify API
   * @param {Object} params - Recommendation parameters
   * @returns {Promise<Object>} Spotify recommendations
   */
  async getSpotifyRecommendations(params) {
    console.log('Getting Spotify recommendations with params:', params);
    
    const response = await fetch('/api/spotify/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Recommendations API error:', error);
      throw new Error(error.error || 'Failed to get recommendations');
    }

    const result = await response.json();
    console.log('Recommendations API response:', result);
    return result;
  }

  /**
   * Search for music by mood
   * @param {string} mood - User's mood
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchByMood(mood, options = {}) {
    const { types = ['track', 'album'], limit = 20 } = options;
    
    // Create search query based on mood
    const searchQuery = this.createMoodSearchQuery(mood);
    console.log('Searching by mood with query:', searchQuery);

    const response = await fetch('/api/spotify/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        types,
        limit,
        market: 'ZA' // Use South Africa market based on user profile
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Search API error:', error);
      throw new Error(error.error || 'Failed to search');
    }

    const result = await response.json();
    console.log('Search API response:', result);
    return result;
  }

  /**
   * Create search query based on mood
   * @param {string} mood - User's mood
   * @returns {string} Search query
   */
  createMoodSearchQuery(mood) {
    const normalizedMood = mood.toLowerCase().trim();
    
    // Map moods to search terms
    const moodSearchTerms = {
      sad: 'sad melancholy blues emotional',
      happy: 'happy upbeat cheerful positive',
      calm: 'calm peaceful relaxing ambient',
      energetic: 'energetic upbeat dance electronic',
      romantic: 'romantic love ballad intimate',
      angry: 'angry rock metal aggressive',
      nostalgic: 'nostalgic vintage classic retro',
      confident: 'confident powerful motivational'
    };

    // Find matching search terms
    for (const [key, terms] of Object.entries(moodSearchTerms)) {
      if (normalizedMood.includes(key) || key.includes(normalizedMood)) {
        return terms;
      }
    }

    // Fallback to the mood itself
    return normalizedMood;
  }

  /**
   * Extract unique albums from track list
   * @param {Array} tracks - Array of track objects
   * @returns {Array} Array of unique album objects
   */
  extractAlbumsFromTracks(tracks) {
    const albumMap = new Map();
    
    tracks.forEach(track => {
      if (track.album && !albumMap.has(track.album.id)) {
        albumMap.set(track.album.id, track.album);
      }
    });

    return Array.from(albumMap.values());
  }

  /**
   * Get fallback recommendations when API fails
   * @param {string} mood - User's mood
   * @returns {Object} Fallback recommendations
   */
  getFallbackRecommendations(mood) {
    return {
      mood,
      audioFeatures: this.mapMoodToAudioFeatures(mood),
      recommendations: {
        tracks: [],
        albums: []
      },
      searchResults: {
        tracks: [],
        albums: []
      },
      error: 'Unable to fetch recommendations. Please try again later.'
    };
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();
export default recommendationService;