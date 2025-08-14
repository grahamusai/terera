/**
 * Spotify OAuth Callback Handler
 * Handles the OAuth callback from Spotify and exchanges the authorization code for tokens
 */

import { NextResponse } from 'next/server';
import { getSpotifyConfig, validateSpotifyConfig } from '../../../../../lib/config/spotify.js';

export async function POST(request) {
  try {
    // Validate server-side configuration
    validateSpotifyConfig();
    
    const body = await request.json();
    const { code, state, error } = body;

    // Handle OAuth errors
    if (error) {
      console.error('Spotify OAuth error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Missing code or state parameter');
      return NextResponse.json({ error: 'missing_parameters' }, { status: 400 });
    }

    // For now, we'll skip PKCE validation in the server-side callback
    // In a production app, you'd want to store these in a secure server-side session
    // or use a different approach like storing them in encrypted cookies
    
    // TODO: Implement proper PKCE validation with server-side storage
    console.log('Received callback with code and state - proceeding with token exchange');

    const config = getSpotifyConfig();

    // Exchange authorization code for access token
    const tokenResponse = await fetch(config.endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.json({ error: 'token_exchange_failed' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();

    // Create successful response
    const response = NextResponse.json({ success: true });

    // Set secure HTTP-only cookies for tokens
    response.cookies.set('spotify_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in, // Token expiry time in seconds
    });

    if (tokenData.refresh_token) {
      response.cookies.set('spotify_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;

  } catch (error) {
    console.error('Callback handler error:', error);
    return NextResponse.json({ error: 'callback_handler_error' }, { status: 500 });
  }
}