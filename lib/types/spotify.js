/**
 * Spotify API Response Types
 * Based on Spotify Web API documentation
 */

/**
 * @typedef {Object} SpotifyImage
 * @property {string} url - The source URL of the image
 * @property {number} height - The image height in pixels
 * @property {number} width - The image width in pixels
 */

/**
 * @typedef {Object} SpotifyArtist
 * @property {string} id - The Spotify ID for the artist
 * @property {string} name - The name of the artist
 * @property {Object} external_urls - External URLs for this artist
 * @property {string} external_urls.spotify - The Spotify URL for the artist
 */

/**
 * @typedef {Object} SpotifyAlbum
 * @property {string} id - The Spotify ID for the album
 * @property {string} name - The name of the album
 * @property {SpotifyArtist[]} artists - The artists of the album
 * @property {SpotifyImage[]} images - The cover art for the album
 * @property {string} release_date - The date the album was first released
 * @property {number} total_tracks - The number of tracks in the album
 * @property {Object} external_urls - External URLs for this album
 * @property {string} external_urls.spotify - The Spotify URL for the album
 */

/**
 * @typedef {Object} SpotifyTrack
 * @property {string} id - The Spotify ID for the track
 * @property {string} name - The name of the track
 * @property {SpotifyArtist[]} artists - The artists who performed the track
 * @property {SpotifyAlbum} album - The album on which the track appears
 * @property {number} duration_ms - The track length in milliseconds
 * @property {string|null} preview_url - A link to a 30 second preview (MP3 format) of the track
 * @property {Object} external_urls - External URLs for this track
 * @property {string} external_urls.spotify - The Spotify URL for the track
 */

/**
 * @typedef {Object} AudioFeatures
 * @property {number} valence - Musical positiveness (0.0 to 1.0)
 * @property {number} energy - Perceptual measure of intensity (0.0 to 1.0)
 * @property {number} danceability - How suitable a track is for dancing (0.0 to 1.0)
 * @property {number} acousticness - Confidence measure of whether the track is acoustic (0.0 to 1.0)
 * @property {number} instrumentalness - Predicts whether a track contains no vocals (0.0 to 1.0)
 * @property {number} tempo - Overall estimated tempo of a track in beats per minute (BPM)
 */

/**
 * @typedef {Object} SpotifySearchResponse
 * @property {Object} tracks - Track search results
 * @property {SpotifyTrack[]} tracks.items - Array of track objects
 * @property {number} tracks.total - Total number of tracks available
 * @property {Object} albums - Album search results
 * @property {SpotifyAlbum[]} albums.items - Array of album objects
 * @property {number} albums.total - Total number of albums available
 */

/**
 * @typedef {Object} SpotifyRecommendationsResponse
 * @property {SpotifyTrack[]} tracks - Array of recommended track objects
 */

/**
 * @typedef {Object} SpotifyTokenResponse
 * @property {string} access_token - The access token
 * @property {string} token_type - How the access token may be used (always "Bearer")
 * @property {string} scope - A space-separated list of scopes which have been granted
 * @property {number} expires_in - The time period (in seconds) for which the access token is valid
 * @property {string} refresh_token - A token that can be sent to the Spotify Accounts service to obtain a new access token
 */

/**
 * @typedef {Object} MoodSearchHistory
 * @property {string} id - Unique identifier for the search
 * @property {string} mood - The mood that was searched
 * @property {Date} timestamp - When the search was performed
 * @property {Object} recommendations - The recommendations returned
 * @property {SpotifyAlbum[]} recommendations.albums - Album recommendations
 * @property {SpotifyTrack[]} recommendations.tracks - Track recommendations
 * @property {AudioFeatures} audioFeatures - The audio features used for the search
 */

/**
 * @typedef {Object} MoodAnalysis
 * @property {string} primaryEmotion - The primary emotion detected
 * @property {number} intensity - The intensity of the emotion (0.0 to 1.0)
 * @property {AudioFeatures} audioFeatures - The corresponding audio features
 * @property {string[]} searchTerms - Terms to use in Spotify search
 */

export {};