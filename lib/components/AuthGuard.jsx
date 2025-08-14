/**
 * Authentication Guard Components
 * Provides route protection and authentication requirements
 */

'use client';

import React from 'react';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext.jsx';
import SpotifyAuthButton from '../../components/SpotifyAuthButton.jsx';

/**
 * RequireAuth Component
 * Renders children only if user is authenticated, otherwise shows login prompt
 */
export function RequireAuth({ children, fallback = null }) {
  const { isAuthenticated, isLoading } = useSpotifyAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your Spotify account to access this feature.
          </p>
          <SpotifyAuthButton />
        </div>
      </div>
    );
  }

  return children;
}

/**
 * AuthenticatedOnly Component
 * Conditionally renders content based on authentication status
 */
export function AuthenticatedOnly({ children }) {
  const { isAuthenticated, isLoading } = useSpotifyAuth();

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return children;
}

/**
 * UnauthenticatedOnly Component
 * Renders content only when user is not authenticated
 */
export function UnauthenticatedOnly({ children }) {
  const { isAuthenticated, isLoading } = useSpotifyAuth();

  if (isLoading || isAuthenticated) {
    return null;
  }

  return children;
}

/**
 * AuthStatus Component
 * Displays different content based on authentication status
 */
export function AuthStatus({ 
  loading = null, 
  authenticated = null, 
  unauthenticated = null 
}) {
  const { isAuthenticated, isLoading } = useSpotifyAuth();

  if (isLoading) {
    return loading || (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return authenticated;
  }

  return unauthenticated;
}

/**
 * ProtectedRoute Component
 * Higher-order component for protecting entire routes
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = null,
  loadingComponent = null,
  unauthorizedComponent = null 
}) {
  const { isAuthenticated, isLoading } = useSpotifyAuth();

  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }

    return unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You need to be authenticated to access this page.
          </p>
          <SpotifyAuthButton />
        </div>
      </div>
    );
  }

  return children;
}