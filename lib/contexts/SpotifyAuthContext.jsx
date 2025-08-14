/**
 * Spotify Authentication Context
 * Provides global authentication state management for the application
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { spotifyApi } from '../services/spotifyApi.js';

// Create the authentication context
const SpotifyAuthContext = createContext(null);

/**
 * Custom hook to use the Spotify authentication context
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of SpotifyAuthProvider
 */
export function useSpotifyAuth() {
  const context = useContext(SpotifyAuthContext);
  if (!context) {
    throw new Error('useSpotifyAuth must be used within a SpotifyAuthProvider');
  }
  return context;
}

/**
 * Spotify Authentication Provider Component
 * Manages authentication state and provides it to child components
 */
export function SpotifyAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

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

  // Set up automatic token refresh
  useEffect(() => {
    let refreshInterval;
    
    if (isAuthenticated && accessToken) {
      // Refresh token every 50 minutes (tokens expire after 1 hour)
      refreshInterval = setInterval(() => {
        refreshToken();
      }, 50 * 60 * 1000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated, accessToken]);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const authenticated = spotifyApi.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const token = spotifyApi.getAccessToken();
        setAccessToken(token);
        
        // Try to get user profile to verify token is still valid
        try {
          const userProfile = await spotifyApi.getCurrentUser();
          setUser(userProfile);
        } catch (error) {
          console.error('Failed to get user profile:', error);
          // Token might be expired, try to refresh
          await refreshToken();
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setError(error.message);
      setIsAuthenticated(false);
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthCallback = useCallback(async (code, state) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await spotifyApi.handleAuthCallback(code, state);
      const token = spotifyApi.getAccessToken();
      const userProfile = await spotifyApi.getCurrentUser();
      
      setIsAuthenticated(true);
      setAccessToken(token);
      setUser(userProfile);
    } catch (error) {
      console.error('Auth callback failed:', error);
      setError(error.message);
      setIsAuthenticated(false);
      setAccessToken(null);
      setUser(null);
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
    setAccessToken(null);
    setUser(null);
    setError(null);
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      await spotifyApi.refreshAccessToken();
      const token = spotifyApi.getAccessToken();
      setAccessToken(token);
      
      // Verify the new token works
      const userProfile = await spotifyApi.getCurrentUser();
      setUser(userProfile);
      setIsAuthenticated(true);
      setError(null);
    } catch (error) {
      console.error('Token refresh failed:', error);
      setError(error.message);
      setIsAuthenticated(false);
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const contextValue = {
    // Authentication state
    isAuthenticated,
    isLoading,
    error,
    user,
    accessToken,
    
    // Authentication methods
    login,
    logout,
    refreshToken,
    checkAuthStatus
  };

  return (
    <SpotifyAuthContext.Provider value={contextValue}>
      {children}
    </SpotifyAuthContext.Provider>
  );
}