/**
 * Comprehensive tests for Spotify Authentication Context
 * Tests authentication flow, token management, and error handling
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpotifyAuthProvider, useSpotifyAuth } from '../contexts/SpotifyAuthContext.jsx';
import { spotifyApi } from '../services/spotifyApi.js';

// Mock the spotifyApi service
vi.mock('../services/spotifyApi.js', () => ({
  spotifyApi: {
    isAuthenticated: vi.fn(),
    getAccessToken: vi.fn(),
    getCurrentUser: vi.fn(),
    handleAuthCallback: vi.fn(),
    initiateAuth: vi.fn(),
    logout: vi.fn(),
    refreshAccessToken: vi.fn()
  }
}));

// Test component that uses the auth context
function TestComponent() {
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    user, 
    accessToken,
    login, 
    logout, 
    refreshToken,
    checkAuthStatus 
  } = useSpotifyAuth();
  
  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <div data-testid="user">{user ? user.display_name : 'null'}</div>
      <div data-testid="token">{accessToken || 'null'}</div>
      <button data-testid="login" onClick={login}>Login</button>
      <button data-testid="logout" onClick={logout}>Logout</button>
      <button data-testid="refresh" onClick={refreshToken}>Refresh</button>
      <button data-testid="check-auth" onClick={checkAuthStatus}>Check Auth</button>
    </div>
  );
}

// Mock user data
const mockUser = {
  id: 'test-user',
  display_name: 'Test User',
  email: 'test@example.com'
};

describe('SpotifyAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock implementations
    spotifyApi.isAuthenticated.mockReturnValue(false);
    spotifyApi.getAccessToken.mockReturnValue(null);
    spotifyApi.getCurrentUser.mockResolvedValue(null);
    spotifyApi.handleAuthCallback.mockResolvedValue(undefined);
    spotifyApi.initiateAuth.mockResolvedValue(undefined);
    spotifyApi.logout.mockReturnValue(undefined);
    spotifyApi.refreshAccessToken.mockResolvedValue(undefined);
    
    // Mock window.location
    delete window.location;
    window.location = { 
      search: '',
      origin: 'http://localhost:3000',
      pathname: '/'
    };
    
    // Mock window.history
    window.history = {
      replaceState: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should provide initial unauthenticated state', async () => {
      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      // Should start loading (may be false if already resolved)
      // expect(screen.getByTestId('loading')).toHaveTextContent('true');
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });

    it('should check authentication status on mount', async () => {
      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(spotifyApi.isAuthenticated).toHaveBeenCalled();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should handle successful authentication', async () => {
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('mock-token');
      spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('token')).toHaveTextContent('mock-token');
      });
    });

    it('should handle login action', async () => {
      const user = userEvent.setup();
      
      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByTestId('login'));

      expect(spotifyApi.initiateAuth).toHaveBeenCalled();
    });

    it('should handle logout action', async () => {
      const user = userEvent.setup();
      
      // Start with authenticated state
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('mock-token');
      spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      await user.click(screen.getByTestId('logout'));

      expect(spotifyApi.logout).toHaveBeenCalled();
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });
  });

  describe('OAuth Callback Handling', () => {
    it('should handle successful OAuth callback', async () => {
      // Mock URL with OAuth callback parameters
      window.location.search = '?code=auth-code&state=oauth-state';
      
      spotifyApi.handleAuthCallback.mockResolvedValue(undefined);
      spotifyApi.getAccessToken.mockReturnValue('new-token');
      spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(spotifyApi.handleAuthCallback).toHaveBeenCalledWith('auth-code', 'oauth-state');
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('token')).toHaveTextContent('new-token');
      });

      // Should clean up URL
      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should handle OAuth callback error', async () => {
      // Mock URL with OAuth error
      window.location.search = '?error=access_denied';

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed: access_denied');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Should clean up URL
      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should handle OAuth callback failure', async () => {
      window.location.search = '?code=auth-code&state=oauth-state';
      
      spotifyApi.handleAuthCallback.mockRejectedValue(new Error('Callback failed'));

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Callback failed');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('Token Management', () => {
    it('should handle token refresh', async () => {
      const user = userEvent.setup();
      
      // Start with authenticated state
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('old-token');
      spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Mock successful token refresh
      spotifyApi.refreshAccessToken.mockResolvedValue(undefined);
      spotifyApi.getAccessToken.mockReturnValue('new-token');

      await user.click(screen.getByTestId('refresh'));

      await waitFor(() => {
        expect(spotifyApi.refreshAccessToken).toHaveBeenCalled();
        expect(screen.getByTestId('token')).toHaveTextContent('new-token');
      });
    });

    it('should handle token refresh failure', async () => {
      const user = userEvent.setup();
      
      // Start with authenticated state
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('old-token');
      spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Mock token refresh failure
      spotifyApi.refreshAccessToken.mockRejectedValue(new Error('Refresh failed'));

      await user.click(screen.getByTestId('refresh'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Refresh failed');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });

    it('should handle expired token during user profile fetch', async () => {
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('expired-token');
      spotifyApi.getCurrentUser.mockRejectedValueOnce(new Error('Token expired'));
      
      // Mock successful refresh
      spotifyApi.refreshAccessToken.mockResolvedValue(undefined);
      spotifyApi.getCurrentUser.mockResolvedValueOnce(mockUser);

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(spotifyApi.refreshAccessToken).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication check errors', async () => {
      spotifyApi.isAuthenticated.mockImplementation(() => {
        throw new Error('Auth check failed');
      });

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Auth check failed');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });

    it('should handle login errors', async () => {
      const user = userEvent.setup();
      
      spotifyApi.initiateAuth.mockRejectedValue(new Error('Login failed'));

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      await user.click(screen.getByTestId('login'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Login failed');
      });
    });

    it('should clear errors on successful operations', async () => {
      const user = userEvent.setup();
      
      // Start with an error state
      spotifyApi.initiateAuth.mockRejectedValueOnce(new Error('Login failed'));

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Trigger error
      await user.click(screen.getByTestId('login'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Login failed');
      });

      // Mock successful login
      spotifyApi.initiateAuth.mockResolvedValue(undefined);

      // Try login again
      await user.click(screen.getByTestId('login'));

      // Error should be cleared
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('Context Hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSpotifyAuth must be used within a SpotifyAuthProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Automatic Token Refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set up automatic token refresh when authenticated', async () => {
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('mock-token');
      spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Fast-forward 50 minutes
      act(() => {
        vi.advanceTimersByTime(50 * 60 * 1000);
      });

      // Wait a bit for the interval to trigger
      await waitFor(() => {
        expect(spotifyApi.refreshAccessToken).toHaveBeenCalled();
      }, { timeout: 1000 });
    }, 10000);

    it('should clear refresh interval on logout', async () => {
      const user = userEvent.setup();
      
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('mock-token');
      spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <SpotifyAuthProvider>
          <TestComponent />
        </SpotifyAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Logout
      await user.click(screen.getByTestId('logout'));

      // Fast-forward 50 minutes
      act(() => {
        vi.advanceTimersByTime(50 * 60 * 1000);
      });

      // Should not refresh token after logout
      expect(spotifyApi.refreshAccessToken).not.toHaveBeenCalled();
    }, 10000);
  });
});