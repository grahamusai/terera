/**
 * Basic tests for Spotify API client
 * Run with: node lib/test/spotifyApi.test.js
 */

// Load environment variables from .env file
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envFile = readFileSync(join(process.cwd(), '.env'), 'utf8');
  const envVars = envFile.split('\n').filter(line => line.includes('='));
  envVars.forEach(line => {
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('Warning: Could not load .env file:', error.message);
}

// Mock crypto for Node.js environment if not available
if (typeof crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    subtle: {
      digest: async (algorithm, data) => {
        // Simple mock hash for testing
        const hash = new ArrayBuffer(32);
        const view = new Uint8Array(hash);
        for (let i = 0; i < 32; i++) {
          view[i] = Math.floor(Math.random() * 256);
        }
        return hash;
      }
    }
  };
}

// Mock btoa for Node.js if not available
if (typeof btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}

import { validateSpotifyConfig } from '../config/spotify.js';
import { generatePKCEPair, generateState } from '../auth/pkce.js';

async function runTests() {
  console.log('🧪 Running Spotify API integration tests...\n');

  // Test 1: Configuration validation
  try {
    validateSpotifyConfig();
    console.log('✅ Configuration validation passed');
  } catch (error) {
    console.log('❌ Configuration validation failed:', error.message);
  }

  // Test 2: PKCE pair generation
  try {
    const { codeVerifier, codeChallenge } = await generatePKCEPair();
    
    if (codeVerifier && codeVerifier.length === 128) {
      console.log('✅ PKCE code verifier generated correctly');
    } else {
      console.log('❌ PKCE code verifier generation failed');
    }

    if (codeChallenge && codeChallenge.length > 0) {
      console.log('✅ PKCE code challenge generated correctly');
    } else {
      console.log('❌ PKCE code challenge generation failed');
    }
  } catch (error) {
    console.log('❌ PKCE generation failed:', error.message);
  }

  // Test 3: State generation
  try {
    const state = generateState();
    if (state && state.length === 16) {
      console.log('✅ OAuth state generated correctly');
    } else {
      console.log('❌ OAuth state generation failed');
    }
  } catch (error) {
    console.log('❌ State generation failed:', error.message);
  }

  // Test 4: Spotify API client instantiation
  try {
    // Dynamic import to avoid issues with browser-specific code
    const { spotifyApi } = await import('../services/spotifyApi.js');
    
    if (spotifyApi) {
      console.log('✅ Spotify API client instantiated successfully');
    } else {
      console.log('❌ Spotify API client instantiation failed');
    }
  } catch (error) {
    console.log('❌ Spotify API client test failed:', error.message);
  }

  console.log('\n🎉 Test suite completed!');
}

// Run tests if this file is executed directly
runTests().catch(console.error);

export { runTests };