/**
 * PKCE (Proof Key for Code Exchange) utilities for Spotify OAuth
 * Implements RFC 7636 for secure OAuth 2.0 flows
 */

/**
 * Generate a cryptographically random string for PKCE
 * @param {number} length - Length of the string to generate
 * @returns {string} Random string
 */
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

/**
 * Generate SHA256 hash and base64url encode it
 * @param {string} plain - Plain text to hash
 * @returns {Promise<string>} Base64url encoded hash
 */
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(hash);
}

/**
 * Base64url encode an ArrayBuffer
 * @param {ArrayBuffer} buffer - Buffer to encode
 * @returns {string} Base64url encoded string
 */
function base64urlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate PKCE code verifier and challenge
 * @returns {Promise<{codeVerifier: string, codeChallenge: string}>}
 */
export async function generatePKCEPair() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await sha256(codeVerifier);
  
  return {
    codeVerifier,
    codeChallenge
  };
}

/**
 * Store PKCE code verifier in session storage
 * @param {string} codeVerifier - The code verifier to store
 */
export function storePKCEVerifier(codeVerifier) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('spotify_code_verifier', codeVerifier);
  }
}

/**
 * Retrieve and remove PKCE code verifier from session storage
 * @returns {string|null} The stored code verifier
 */
export function retrievePKCEVerifier() {
  if (typeof window !== 'undefined') {
    const verifier = sessionStorage.getItem('spotify_code_verifier');
    sessionStorage.removeItem('spotify_code_verifier');
    return verifier;
  }
  return null;
}

/**
 * Generate a random state parameter for OAuth security
 * @returns {string} Random state string
 */
export function generateState() {
  return generateRandomString(16);
}

/**
 * Store OAuth state in session storage
 * @param {string} state - The state to store
 */
export function storeState(state) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('spotify_oauth_state', state);
  }
}

/**
 * Retrieve and remove OAuth state from session storage
 * @returns {string|null} The stored state
 */
export function retrieveState() {
  if (typeof window !== 'undefined') {
    const state = sessionStorage.getItem('spotify_oauth_state');
    sessionStorage.removeItem('spotify_oauth_state');
    return state;
  }
  return null;
}