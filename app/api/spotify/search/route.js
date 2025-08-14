/**
 * Spotify Search API Route
 * Handles searching for tracks and albums with mood-based filtering
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('spotify_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { query, types = ['track', 'album'], limit = 20, market = 'ZA', audioFeatures } = body;

    // Build search parameters
    const params = new URLSearchParams({
      q: query,
      type: types.join(','),
      limit: limit.toString(),
      market: market,
    });

    // Make request to Spotify API
    const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
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
      console.error('Spotify search error:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        query: query,
        url: `https://api.spotify.com/v1/search?${params.toString()}`
      });
      return NextResponse.json({ 
        error: `Spotify API error: ${response.status} ${response.statusText}`,
        details: error 
      }, { status: response.status });
    }

    const searchResults = await response.json();
    
    // If audio features are provided, we could filter results here
    // For now, return all results
    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}