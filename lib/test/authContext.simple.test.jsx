/**
 * Simple test for authentication context
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpotifyAuthProvider, useSpotifyAuth } from '../contexts/SpotifyAuthContext.jsx';

// Mock the spotifyApi service
vi.mock('../services/spotifyApi.js', () => ({
  spotifyApi: {
    isAuthenticated: vi.fn(() => false),
    getAccessToken: vi.fn(() => null),
    getCurrentUser: vi.fn(() => Promise.resolve(null)),
    handleAuthCallback: vi.fn(),
    initiateAuth: vi.fn(),
    logout: vi.fn(),
    refreshAccessToken: vi.fn()
  }
}));

// Simple test component
function TestComponent() {
  const { isAuthenticated, isLoading } = useSpotifyAuth();
  
  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
    </div>
  );
}

describe('SpotifyAuthProvider Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <SpotifyAuthProvider>
        <div>Test</div>
      </SpotifyAuthProvider>
    );
  });

  it('should provide context to children', async () => {
    render(
      <SpotifyAuthProvider>
        <TestComponent />
      </SpotifyAuthProvider>
    );

    // Should eventually show not loading
    await screen.findByTestId('authenticated');
    expect(screen.getByTestId('authenticated')).toBeInTheDocument();
  });
});