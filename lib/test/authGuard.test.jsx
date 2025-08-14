/**
 * Tests for Authentication Guard Components
 * Tests route protection and authentication requirements
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpotifyAuthProvider } from '../contexts/SpotifyAuthContext.jsx';
import { 
  RequireAuth, 
  AuthenticatedOnly, 
  UnauthenticatedOnly, 
  AuthStatus, 
  ProtectedRoute 
} from '../components/AuthGuard.jsx';
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

// Mock SpotifyAuthButton
vi.mock('../../components/SpotifyAuthButton.jsx', () => ({
  default: function MockSpotifyAuthButton() {
    return <div data-testid="spotify-auth-button">Mock Auth Button</div>;
  }
}));

// Test wrapper component
function TestWrapper({ children }) {
  return (
    <SpotifyAuthProvider>
      {children}
    </SpotifyAuthProvider>
  );
}

describe('Authentication Guard Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spotifyApi.isAuthenticated.mockReturnValue(false);
    spotifyApi.getAccessToken.mockReturnValue(null);
    spotifyApi.getCurrentUser.mockResolvedValue(null);
    
    // Mock window.location
    delete window.location;
    window.location = { 
      search: '',
      origin: 'http://localhost:3000',
      pathname: '/',
      href: 'http://localhost:3000/'
    };
    
    window.history = {
      replaceState: vi.fn()
    };
  });

  describe('RequireAuth Component', () => {
    it('should show loading state initially', () => {
      render(
        <TestWrapper>
          <RequireAuth>
            <div data-testid="protected-content">Protected Content</div>
          </RequireAuth>
        </TestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render children when authenticated', async () => {
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('mock-token');
      spotifyApi.getCurrentUser.mockResolvedValue({ id: 'test-user', display_name: 'Test User' });

      render(
        <TestWrapper>
          <RequireAuth>
            <div data-testid="protected-content">Protected Content</div>
          </RequireAuth>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should show authentication prompt when not authenticated', async () => {
      render(
        <TestWrapper>
          <RequireAuth>
            <div data-testid="protected-content">Protected Content</div>
          </RequireAuth>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByTestId('spotify-auth-button')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should render custom fallback when provided', async () => {
      const customFallback = <div data-testid="custom-fallback">Custom Fallback</div>;

      render(
        <TestWrapper>
          <RequireAuth fallback={customFallback}>
            <div data-testid="protected-content">Protected Content</div>
          </RequireAuth>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      });

      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument();
    });
  });

  describe('AuthenticatedOnly Component', () => {
    it('should render nothing when loading', () => {
      render(
        <TestWrapper>
          <AuthenticatedOnly>
            <div data-testid="authenticated-content">Authenticated Content</div>
          </AuthenticatedOnly>
        </TestWrapper>
      );

      expect(screen.queryByTestId('authenticated-content')).not.toBeInTheDocument();
    });

    it('should render children when authenticated', async () => {
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('mock-token');
      spotifyApi.getCurrentUser.mockResolvedValue({ id: 'test-user', display_name: 'Test User' });

      render(
        <TestWrapper>
          <AuthenticatedOnly>
            <div data-testid="authenticated-content">Authenticated Content</div>
          </AuthenticatedOnly>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated-content')).toBeInTheDocument();
      });
    });

    it('should render nothing when not authenticated', async () => {
      render(
        <TestWrapper>
          <AuthenticatedOnly>
            <div data-testid="authenticated-content">Authenticated Content</div>
          </AuthenticatedOnly>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('authenticated-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('UnauthenticatedOnly Component', () => {
    it('should render nothing when loading', () => {
      render(
        <TestWrapper>
          <UnauthenticatedOnly>
            <div data-testid="unauthenticated-content">Unauthenticated Content</div>
          </UnauthenticatedOnly>
        </TestWrapper>
      );

      expect(screen.queryByTestId('unauthenticated-content')).not.toBeInTheDocument();
    });

    it('should render children when not authenticated', async () => {
      render(
        <TestWrapper>
          <UnauthenticatedOnly>
            <div data-testid="unauthenticated-content">Unauthenticated Content</div>
          </UnauthenticatedOnly>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unauthenticated-content')).toBeInTheDocument();
      });
    });

    it('should render nothing when authenticated', async () => {
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('mock-token');
      spotifyApi.getCurrentUser.mockResolvedValue({ id: 'test-user', display_name: 'Test User' });

      render(
        <TestWrapper>
          <UnauthenticatedOnly>
            <div data-testid="unauthenticated-content">Unauthenticated Content</div>
          </UnauthenticatedOnly>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('unauthenticated-content')).not.toBeInTheDocument();
      });
    });
  });

  describe('AuthStatus Component', () => {
    it('should render loading content when loading', () => {
      render(
        <TestWrapper>
          <AuthStatus
            loading={<div data-testid="loading-content">Loading Content</div>}
            authenticated={<div data-testid="auth-content">Auth Content</div>}
            unauthenticated={<div data-testid="unauth-content">Unauth Content</div>}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-content')).toBeInTheDocument();
    });

    it('should render default loading when no loading prop provided', () => {
      render(
        <TestWrapper>
          <AuthStatus
            authenticated={<div data-testid="auth-content">Auth Content</div>}
            unauthenticated={<div data-testid="unauth-content">Unauth Content</div>}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render authenticated content when authenticated', async () => {
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('mock-token');
      spotifyApi.getCurrentUser.mockResolvedValue({ id: 'test-user', display_name: 'Test User' });

      render(
        <TestWrapper>
          <AuthStatus
            loading={<div data-testid="loading-content">Loading Content</div>}
            authenticated={<div data-testid="auth-content">Auth Content</div>}
            unauthenticated={<div data-testid="unauth-content">Unauth Content</div>}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-content')).toBeInTheDocument();
      });
    });

    it('should render unauthenticated content when not authenticated', async () => {
      render(
        <TestWrapper>
          <AuthStatus
            loading={<div data-testid="loading-content">Loading Content</div>}
            authenticated={<div data-testid="auth-content">Auth Content</div>}
            unauthenticated={<div data-testid="unauth-content">Unauth Content</div>}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unauth-content')).toBeInTheDocument();
      });
    });
  });

  describe('ProtectedRoute Component', () => {
    it('should show loading state initially', () => {
      render(
        <TestWrapper>
          <ProtectedRoute>
            <div data-testid="route-content">Route Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });

    it('should render children when authenticated', async () => {
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('mock-token');
      spotifyApi.getCurrentUser.mockResolvedValue({ id: 'test-user', display_name: 'Test User' });

      render(
        <TestWrapper>
          <ProtectedRoute>
            <div data-testid="route-content">Route Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('route-content')).toBeInTheDocument();
      });
    });

    it('should show access denied when not authenticated', async () => {
      render(
        <TestWrapper>
          <ProtectedRoute>
            <div data-testid="route-content">Route Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByTestId('spotify-auth-button')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('route-content')).not.toBeInTheDocument();
    });

    it('should render custom loading component', () => {
      const customLoading = <div data-testid="custom-loading">Custom Loading</div>;

      render(
        <TestWrapper>
          <ProtectedRoute loadingComponent={customLoading}>
            <div data-testid="route-content">Route Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    });

    it('should render custom unauthorized component', async () => {
      const customUnauthorized = <div data-testid="custom-unauthorized">Custom Unauthorized</div>;

      render(
        <TestWrapper>
          <ProtectedRoute unauthorizedComponent={customUnauthorized}>
            <div data-testid="route-content">Route Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-unauthorized')).toBeInTheDocument();
      });

      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('should handle redirect when redirectTo is provided', async () => {
      const originalHref = window.location.href;
      
      render(
        <TestWrapper>
          <ProtectedRoute redirectTo="/login">
            <div data-testid="route-content">Route Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(window.location.href).toBe('/login');
      });

      // Restore original href
      window.location.href = originalHref;
    });
  });

  describe('Integration Tests', () => {
    it('should work together with authentication flow', async () => {
      const user = userEvent.setup();
      
      // Start unauthenticated
      render(
        <TestWrapper>
          <RequireAuth>
            <div data-testid="protected-content">Protected Content</div>
          </RequireAuth>
          <UnauthenticatedOnly>
            <div data-testid="login-prompt">Please log in</div>
          </UnauthenticatedOnly>
          <AuthenticatedOnly>
            <div data-testid="welcome-message">Welcome!</div>
          </AuthenticatedOnly>
        </TestWrapper>
      );

      // Should show unauthenticated state
      await waitFor(() => {
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByTestId('login-prompt')).toBeInTheDocument();
        expect(screen.queryByTestId('welcome-message')).not.toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('should handle authentication state changes', async () => {
      // This test would require more complex mocking to simulate state changes
      // For now, we'll test the static states
      spotifyApi.isAuthenticated.mockReturnValue(true);
      spotifyApi.getAccessToken.mockReturnValue('mock-token');
      spotifyApi.getCurrentUser.mockResolvedValue({ id: 'test-user', display_name: 'Test User' });

      render(
        <TestWrapper>
          <AuthenticatedOnly>
            <div data-testid="authenticated-only">Authenticated Only</div>
          </AuthenticatedOnly>
          <UnauthenticatedOnly>
            <div data-testid="unauthenticated-only">Unauthenticated Only</div>
          </UnauthenticatedOnly>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated-only')).toBeInTheDocument();
        expect(screen.queryByTestId('unauthenticated-only')).not.toBeInTheDocument();
      });
    });
  });
});
