/**
 * React hook for managing Spotify authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { spotifyApi } from '../services/spotifyApi.js';

export function useSpotifyAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle OAuth callback parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setError(`Authentication failed: ${error}`);
        setIsLoading(false);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (code && state) {
        handleAuthCallback(code, state);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const authenticated = spotifyApi.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Try to get user profile to verify token is still valid
        try {
          const userProfile = await spotifyApi.getCurrentUser();
          setUser(userProfile);
        } catch (error) {
          console.error('Failed to get user profile:', error);
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setError(error.message);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthCallback = useCallback(async (code, state) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await spotifyApi.handleAuthCallback(code, state);
      const userProfile = await spotifyApi.getCurrentUser();
      
      setIsAuthenticated(true);
      setUser(userProfile);
    } catch (error) {
      console.error('Auth callback failed:', error);
      setError(error.message);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    try {
      setError(null);
      await spotifyApi.initiateAuth();
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message);
    }
  }, []);

  const logout = useCallback(() => {
    spotifyApi.logout();
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      await spotifyApi.refreshAccessToken();
      await checkAuthStatus();
    } catch (error) {
      console.error('Token refresh failed:', error);
      setError(error.message);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [checkAuthStatus]);

  return {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout,
    refreshToken,
    checkAuthStatus
  };
}