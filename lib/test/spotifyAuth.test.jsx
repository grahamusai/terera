/**
 * Tests for Spotify Authentication Context and Provider
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
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

// Mock window.location
const mockLocation = {
  search: '',
  pathname: '/test',
  origin: 'http://localhost:3000'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock window.history
const mockHistory = {
  replaceState: vi.fn()
};

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true
});

// Test component that uses the auth context
function TestComponent() {
  const auth = useSpotifyAuth();
  
  return (
    <div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="error">{auth.error || 'none'}</div>
      <div data-testid="user">{auth.user?.display_name || 'none'}</div>
      <div data-testid="token">{auth.accessToken || 'none'}</div>
      <button onClick={auth.login} data-testid="login">Login</button>
      <button onClick={auth.logout} data-testid="logout">Logout</button>
      <button onClick={auth.refreshToken} data-testid="refresh">Refresh</button>
    </div>
  );
}

describe('SpotifyAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.search = '';
    mockHistory.replaceState.mockClear();
    
    // Default mock implementations
    spotifyApi.isAuthenticated.mockReturnValue(false);
    spotifyApi.getAccessToken.mockReturnValue(null);
    spotifyApi.getCurrentUser.mockResolvedValue({ display_name: 'Test User', id: 'testuser' });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should provide authentication context to children', async () => {
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });
  });

  it('should throw error when useSpotifyAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSpotifyAuth must be used within a SpotifyAuthProvider');
    
    consoleSpy.mockRestore();
  });

  it('should check authentication status on mount', async () => {
    spotifyApi.isAuthenticated.mockReturnValue(true);
    spotifyApi.getAccessToken.mockReturnValue('test-token');
    
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(spotifyApi.isAuthenticated).toHaveBeenCalled();
      expect(spotifyApi.getCurrentUser).toHaveBeenCalled();
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('token')).toHaveTextContent('test-token');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
  });

  it('should handle authentication callback from URL parameters', async () => {
    mockLocation.search = '?code=test-code&state=test-state';
    
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(spotifyApi.handleAuthCallback).toHaveBeenCalledWith('test-code', 'test-state');
      expect(mockHistory.replaceState).toHaveBeenCalledWith({}, document.title, '/test');
    });
  });

  it('should handle authentication error from URL parameters', async () => {
    mockLocation.search = '?error=access_denied';
    
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Authentication failed: access_denied');
      expect(mockHistory.replaceState).toHaveBeenCalledWith({}, document.title, '/test');
    });
  });

  it('should handle login action', async () => {
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    act(() => {
      screen.getByTestId('login').click();
    });

    expect(spotifyApi.initiateAuth).toHaveBeenCalled();
  });

  it('should handle logout action', async () => {
    spotifyApi.isAuthenticated.mockReturnValue(true);
    spotifyApi.getAccessToken.mockReturnValue('test-token');
    
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    act(() => {
      screen.getByTestId('logout').click();
    });

    expect(spotifyApi.logout).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('should handle token refresh', async () => {
    spotifyApi.isAuthenticated.mockReturnValue(true);
    spotifyApi.getAccessToken.mockReturnValue('new-token');
    
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    act(() => {
      screen.getByTestId('refresh').click();
    });

    await waitFor(() => {
      expect(spotifyApi.refreshAccessToken).toHaveBeenCalled();
    });
  });

  it('should handle token refresh failure', async () => {
    spotifyApi.refreshAccessToken.mockRejectedValue(new Error('Refresh failed'));
    
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    act(() => {
      screen.getByTestId('refresh').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Refresh failed');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('should handle user profile fetch failure during auth check', async () => {
    spotifyApi.isAuthenticated.mockReturnValue(true);
    spotifyApi.getAccessToken.mockReturnValue('test-token');
    spotifyApi.getCurrentUser.mockRejectedValue(new Error('Profile fetch failed'));
    spotifyApi.refreshAccessToken.mockResolvedValue();
    
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(spotifyApi.refreshAccessToken).toHaveBeenCalled();
    });
  });

  it('should set up automatic token refresh when authenticated', async () => {
    vi.useFakeTimers();
    
    spotifyApi.isAuthenticated.mockReturnValue(true);
    spotifyApi.getAccessToken.mockReturnValue('test-token');
    
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

    expect(spotifyApi.refreshAccessToken).toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('should handle auth callback success', async () => {
    spotifyApi.handleAuthCallback.mockResolvedValue();
    spotifyApi.getAccessToken.mockReturnValue('new-token');
    spotifyApi.getCurrentUser.mockResolvedValue({ display_name: 'New User', id: 'newuser' });
    
    mockLocation.search = '?code=success-code&state=success-state';
    
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('token')).toHaveTextContent('new-token');
      expect(screen.getByTestId('user')).toHaveTextContent('New User');
    });
  });

  it('should handle auth callback failure', async () => {
    spotifyApi.handleAuthCallback.mockRejectedValue(new Error('Callback failed'));
    
    mockLocation.search = '?code=fail-code&state=fail-state';
    
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

  it('should handle login failure', async () => {
    spotifyApi.initiateAuth.mockRejectedValue(new Error('Login failed'));
    
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    act(() => {
      screen.getByTestId('login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Login failed');
    });
  });
});