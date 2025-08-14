/**
 * Spotify Current User API Route
 * Handles getting current user profile using server-side tokens
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Make request to Spotify API
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
      const error = await response.text();
      return NextResponse.json({ error: 'Spotify API error' }, { status: response.status });
    }

    const userData = await response.json();
    return NextResponse.json(userData);

  } catch (error) {
    console.error('Current user API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}