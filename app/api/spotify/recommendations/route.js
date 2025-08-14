/**
 * Spotify Recommendations API Route
 * Handles getting music recommendations based on mood and audio features
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
    const { audioFeatures, limit = 20 } = body;

    // Build recommendation parameters
    const params = new URLSearchParams({
      limit: limit.toString(),
      market: 'US', // Default market
    });

    // Add seed genres (required by Spotify API)
    // Using only well-known Spotify genres
    const seedGenres = ['pop', 'rock'];
    params.append('seed_genres', seedGenres.join(','));

    // Add audio feature parameters
    if (audioFeatures) {
      Object.entries(audioFeatures).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(`target_${key}`, value.toString());
        }
      });
    }

    // Make request to Spotify API
    const response = await fetch(`https://api.spotify.com/v1/recommendations?${params.toString()}`, {
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
      console.error('Spotify recommendations error:', {
        status: response.status,
        statusText: response.statusText,
        error: error,
        url: `https://api.spotify.com/v1/recommendations?${params.toString()}`
      });
      return NextResponse.json({ 
        error: `Spotify API error: ${response.status} ${response.statusText}`,
        details: error 
      }, { status: response.status });
    }

    const recommendations = await response.json();
    return NextResponse.json(recommendations);

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}