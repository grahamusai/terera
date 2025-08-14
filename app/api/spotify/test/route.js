/**
 * Spotify API Test Route
 * Tests basic Spotify API connectivity and available genres
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

    console.log('Testing Spotify API with token:', accessToken.substring(0, 20) + '...');

    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.text();
      console.error('User API error:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        error: error
      });
      return NextResponse.json({ 
        error: `User API error: ${userResponse.status}`,
        details: error 
      }, { status: userResponse.status });
    }

    const user = await userResponse.json();
    console.log('User API works:', user.display_name || user.id);

    // Test 2: Simple search call (more reliable than recommendations)
    const searchParams = new URLSearchParams({
      q: 'happy music',
      type: 'track',
      limit: '5',
      market: 'US'
    });

    const searchResponse = await fetch(`https://api.spotify.com/v1/search?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error('Search test error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: error,
        url: `https://api.spotify.com/v1/search?${searchParams.toString()}`
      });
      return NextResponse.json({ 
        error: `Search test error: ${searchResponse.status}`,
        details: error 
      }, { status: searchResponse.status });
    }

    const searchResults = await searchResponse.json();
    console.log('Test search success:', searchResults.tracks.items.length, 'tracks');

    return NextResponse.json({
      success: true,
      user: user.display_name || user.id,
      testSearchResults: searchResults.tracks.items.length,
      sampleTracks: searchResults.tracks.items.slice(0, 3).map(t => t.name)
    });

  } catch (error) {
    console.error('Spotify test error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}