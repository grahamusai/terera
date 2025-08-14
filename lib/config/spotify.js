/**
 * Spotify API Configuration
 * Manages environment variables and API endpoints
 */

// Spotify API endpoints
export const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
export const SPOTIFY_ACCOUNTS_BASE_URL = 'https://accounts.spotify.com';

// OAuth 2.0 PKCE configuration
export function getSpotifyConfig() {
  return {
    clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
    // Only include clientSecret on server-side
    clientSecret: typeof window === 'undefined' ? process.env.SPOTIFY_CLIENT_SECRET : undefined,
    redirectUri: typeof window !== 'undefined' 
      ? `${window.location.origin}/api/auth/callback/spotify`
      : 'http://localhost:3000/api/auth/callback/spotify',
    scopes: [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state'
    ].join(' '),
    
    // API endpoints
    endpoints: {
      authorize: `${SPOTIFY_ACCOUNTS_BASE_URL}/authorize`,
      token: `${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`,
      search: `${SPOTIFY_API_BASE_URL}/search`,
      recommendations: `${SPOTIFY_API_BASE_URL}/recommendations`,
      audioFeatures: `${SPOTIFY_API_BASE_URL}/audio-features`,
      me: `${SPOTIFY_API_BASE_URL}/me`
    }
  };
}

export const SPOTIFY_CONFIG = getSpotifyConfig();

// Validate required environment variables
export function validateSpotifyConfig() {
  const config = getSpotifyConfig();
  
  // Client-side validation - only check variables that should be available in browser
  if (typeof window !== 'undefined') {
    const requiredClientVars = {
      'NEXT_PUBLIC_SPOTIFY_CLIENT_ID': config.clientId
    };

    const missing = Object.entries(requiredClientVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(`Missing required Spotify environment variables: ${missing.join(', ')}`);
    }
  } else {
    // Server-side validation - check all variables including secrets
    const requiredVars = {
      'NEXT_PUBLIC_SPOTIFY_CLIENT_ID': config.clientId,
      'SPOTIFY_CLIENT_SECRET': config.clientSecret
    };

    const missing = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(`Missing required Spotify environment variables: ${missing.join(', ')}`);
    }
  }

  return true;
}