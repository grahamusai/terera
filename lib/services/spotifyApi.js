/**
 * Spotify API Client Service
 * Handles authentication and API requests to Spotify Web API
 */

import { getSpotifyConfig, validateSpotifyConfig } from '../config/spotify.js';
import { generateState, storeState } from '../auth/pkce.js';

class SpotifyApiClient {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // Load existing tokens from localStorage
    this.loadTokensFromStorage();
  }

  get config() {
    return getSpotifyConfig();
  }

  /**
   * Load tokens from localStorage if available
   */
  loadTokensFromStorage() {
    if (typeof window !== 'undefined') {
      const storedTokens = localStorage.getItem('spotify_tokens');
      if (storedTokens) {
        try {
          const tokens = JSON.parse(storedTokens);
          this.accessToken = tokens.accessToken;
          this.refreshToken = tokens.refreshToken;
          this.tokenExpiry = new Date(tokens.tokenExpiry);
        } catch (error) {
          console.error('Error loading stored tokens:', error);
          this.clearStoredTokens();
        }
      }
    }
  }

  /**
   * Save tokens to localStorage
   */
  saveTokensToStorage() {
    if (typeof window !== 'undefined' && this.accessToken) {
      const tokens = {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        tokenExpiry: this.tokenExpiry?.toISOString()
      };
      localStorage.setItem('spotify_tokens', JSON.stringify(tokens));
    }
  }

  /**
   * Clear stored tokens
   */
  clearStoredTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spotify_tokens');
    }
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!(this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry);
  }

  /**
   * Get current access token
   * @returns {string|null} Access token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Initiate Spotify OAuth 2.0 flow
   * @returns {Promise<string>} Authorization URL
   */
  async initiateAuth() {
    const state = generateState();
    
    // Store state for validation
    storeState(state);
    
    // Validate configuration before use
    validateSpotifyConfig();
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      scope: this.config.scopes,
      redirect_uri: this.config.redirectUri,
      state: state
    });
    
    const authUrl = `${this.config.endpoints.authorize}?${params.toString()}`;
    
    // Redirect to Spotify authorization
    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    }
    
    return authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   * @param {string} code - Authorization code from callback
   * @param {string} state - State parameter from callback
   * @returns {Promise<boolean>} Success status
   */
  async handleAuthCallback(code, state) {
    // Verify state parameter
    const storedState = retrieveState();
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    // Retrieve PKCE code verifier
    const codeVerifier = retrievePKCEVerifier();
    if (!codeVerifier) {
      throw new Error('Missing PKCE code verifier');
    }

    try {
      const response = await fetch(this.config.endpoints.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.config.redirectUri,
          client_id: this.config.clientId,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
      }

      const tokens = await response.json();
      this.setTokens(tokens);
      return true;
    } catch (error) {
      console.error('Auth callback error:', error);
      throw error;
    }
  }

  /**
   * Set authentication tokens
   * @param {Object} tokens - Token response from Spotify
   */
  setTokens(tokens) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));
    this.saveTokensToStorage();
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<boolean>} Success status
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(this.config.endpoints.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.config.clientId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
      }

      const tokens = await response.json();
      this.setTokens({
        ...tokens,
        refresh_token: tokens.refresh_token || this.refreshToken // Keep existing refresh token if not provided
      });
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearStoredTokens();
      throw error;
    }
  }

  /**
   * Make authenticated API request to Spotify
   * @param {string} endpoint - API endpoint (relative to base URL)
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} API response
   */
  async makeApiRequest(endpoint, options = {}) {
    // Check if token needs refresh
    if (this.tokenExpiry && new Date() >= this.tokenExpiry && this.refreshToken) {
      await this.refreshAccessToken();
    }

    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.config.endpoints.search.replace('/search', '')}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      if (this.refreshToken) {
        await this.refreshAccessToken();
        // Retry the request with new token
        return this.makeApiRequest(endpoint, options);
      } else {
        this.clearStoredTokens();
        throw new Error('Authentication required');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Spotify API error: ${error.error?.message || error.error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Logout and clear all tokens
   */
  logout() {
    this.clearStoredTokens();
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile
   */
  async getCurrentUser() {
    return this.makeApiRequest('/me');
  }

  /**
   * Search for tracks and albums
   * @param {string} query - Search query
   * @param {string[]} types - Types to search for ('track', 'album', 'artist')
   * @param {number} limit - Number of results to return
   * @returns {Promise<Object>} Search results
   */
  async search(query, types = ['track', 'album'], limit = 20) {
    const params = new URLSearchParams({
      q: query,
      type: types.join(','),
      limit: limit.toString()
    });

    return this.makeApiRequest(`/search?${params.toString()}`);
  }

  /**
   * Get recommendations based on seed tracks and audio features
   * @param {Object} params - Recommendation parameters
   * @returns {Promise<Object>} Recommendations
   */
  async getRecommendations(params) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.makeApiRequest(`/recommendations?${searchParams.toString()}`);
  }

  /**
   * Get audio features for tracks
   * @param {string[]} trackIds - Array of track IDs
   * @returns {Promise<Object>} Audio features
   */
  async getAudioFeatures(trackIds) {
    const ids = trackIds.join(',');
    return this.makeApiRequest(`/audio-features?ids=${ids}`);
  }
}

// Export singleton instance
export const spotifyApi = new SpotifyApiClient();
export default spotifyApi;