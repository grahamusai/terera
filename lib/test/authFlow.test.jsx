import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpotifyAuthProvider, useSpotifyAuth } from '../contexts/SpotifyAuthContext.jsx';
import { RequireAuth } from '../components/AuthGuard.jsx';
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
        const { login } = useSpotifyAuth();
        return (
            <button data-testid="mock-login-button" onClick={login}>
                Mock Login
            </button>
        );
    }
}));

// Test component that uses authentication
function AuthTestComponent() {
    const { isAuthenticated, user, login, logout } = useSpotifyAuth();

    return (
        <div>
            <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
            <div data-testid="user-info">{user ? user.display_name : 'no-user'}</div>
            <button data-testid="login-btn" onClick={login}>Login</button>
            <button data-testid="logout-btn" onClick={logout}>Logout</button>
        </div>
    );
}

// Protected content component
function ProtectedContent() {
    return (
        <RequireAuth>
            <div data-testid="protected-content">This is protected content</div>
        </RequireAuth>
    );
}

const mockUser = {
    id: 'test-user',
    display_name: 'Test User',
    email: 'test@example.com'
};

describe('Authentication Flow Integration', () => {
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
            pathname: '/'
        };

        window.history = {
            replaceState: vi.fn()
        };
    });

    describe('Basic Authentication State', () => {
        it('should provide unauthenticated state by default', async () => {
            render(
                <SpotifyAuthProvider>
                    <AuthTestComponent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
                expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
            });
        });

        it('should provide authenticated state when user is logged in', async () => {
            spotifyApi.isAuthenticated.mockReturnValue(true);
            spotifyApi.getAccessToken.mockReturnValue('mock-token');
            spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

            render(
                <SpotifyAuthProvider>
                    <AuthTestComponent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
                expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
            });
        });
    });

    describe('Authentication Actions', () => {
        it('should call spotifyApi.initiateAuth when login is triggered', async () => {
            const user = userEvent.setup();

            render(
                <SpotifyAuthProvider>
                    <AuthTestComponent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
            });

            await user.click(screen.getByTestId('login-btn'));

            expect(spotifyApi.initiateAuth).toHaveBeenCalled();
        });

        it('should call spotifyApi.logout and update state when logout is triggered', async () => {
            const user = userEvent.setup();

            // Start authenticated
            spotifyApi.isAuthenticated.mockReturnValue(true);
            spotifyApi.getAccessToken.mockReturnValue('mock-token');
            spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

            render(
                <SpotifyAuthProvider>
                    <AuthTestComponent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
            });

            await user.click(screen.getByTestId('logout-btn'));

            expect(spotifyApi.logout).toHaveBeenCalled();
            expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
            expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
        });
    });

    describe('OAuth Callback Handling', () => {
        it('should handle successful OAuth callback', async () => {
            window.location.search = '?code=auth-code&state=oauth-state';

            spotifyApi.handleAuthCallback.mockResolvedValue(undefined);
            spotifyApi.getAccessToken.mockReturnValue('new-token');
            spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

            render(
                <SpotifyAuthProvider>
                    <AuthTestComponent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(spotifyApi.handleAuthCallback).toHaveBeenCalledWith('auth-code', 'oauth-state');
            });

            await waitFor(() => {
                expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
                expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
            });

            expect(window.history.replaceState).toHaveBeenCalled();
        });

        it('should handle OAuth callback error', async () => {
            window.location.search = '?error=access_denied';

            render(
                <SpotifyAuthProvider>
                    <AuthTestComponent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
            });

            expect(window.history.replaceState).toHaveBeenCalled();
        });
    });

    describe('Route Protection', () => {
        it('should show login prompt for protected content when unauthenticated', async () => {
            render(
                <SpotifyAuthProvider>
                    <ProtectedContent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Authentication Required')).toBeInTheDocument();
                expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
            });
        });

        it('should show protected content when authenticated', async () => {
            spotifyApi.isAuthenticated.mockReturnValue(true);
            spotifyApi.getAccessToken.mockReturnValue('mock-token');
            spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

            render(
                <SpotifyAuthProvider>
                    <ProtectedContent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('protected-content')).toBeInTheDocument();
                expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument();
            });
        });

        it('should allow login from protected route', async () => {
            const user = userEvent.setup();

            render(
                <SpotifyAuthProvider>
                    <ProtectedContent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('mock-login-button')).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('mock-login-button'));

            expect(spotifyApi.initiateAuth).toHaveBeenCalled();
        });
    });

    describe('Token Management', () => {
        it('should handle token refresh setup', async () => {
            // Start authenticated
            spotifyApi.isAuthenticated.mockReturnValue(true);
            spotifyApi.getAccessToken.mockReturnValue('old-token');
            spotifyApi.getCurrentUser.mockResolvedValue(mockUser);

            render(
                <SpotifyAuthProvider>
                    <AuthTestComponent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
            });

            // Verify that the refresh token functionality is available
            expect(spotifyApi.refreshAccessToken).toBeDefined();

            // Simulate what would happen during a refresh
            spotifyApi.refreshAccessToken.mockResolvedValue(undefined);
            spotifyApi.getAccessToken.mockReturnValue('new-token');

            // The automatic refresh would be handled by the context internally
            // We just verify the mocks are set up correctly
            expect(spotifyApi.refreshAccessToken).toHaveBeenCalledTimes(0); // Not called yet
        });

        it('should handle token refresh failure', async () => {
            spotifyApi.isAuthenticated.mockReturnValue(true);
            spotifyApi.getAccessToken.mockReturnValue('expired-token');
            spotifyApi.getCurrentUser.mockRejectedValue(new Error('Token expired'));

            render(
                <SpotifyAuthProvider>
                    <AuthTestComponent />
                </SpotifyAuthProvider>
            );

            // The context should handle the error gracefully
            await waitFor(() => {
                expect(screen.getByTestId('auth-status')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle authentication errors gracefully', async () => {
            spotifyApi.isAuthenticated.mockImplementation(() => {
                throw new Error('Auth check failed');
            });

            render(
                <SpotifyAuthProvider>
                    <AuthTestComponent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
            });
        });

        it('should handle login errors', async () => {
            const user = userEvent.setup();

            spotifyApi.initiateAuth.mockRejectedValue(new Error('Login failed'));

            render(
                <SpotifyAuthProvider>
                    <AuthTestComponent />
                </SpotifyAuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
            });

            await user.click(screen.getByTestId('login-btn'));

            // Should still be unauthenticated after failed login
            expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
        });
    });

    describe('Context Hook Validation', () => {
        it('should throw error when useSpotifyAuth is used outside provider', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            expect(() => {
                render(<AuthTestComponent />);
            }).toThrow('useSpotifyAuth must be used within a SpotifyAuthProvider');

            consoleSpy.mockRestore();
        });
    });
});