/**
 * Mood to Audio Features Mapping
 * Maps emotional states to Spotify audio features for music recommendations
 */

export const MOOD_MAPPINGS = {
  // Sad moods - low valence, low energy
  sad: {
    valence: 0.2,
    energy: 0.3,
    acousticness: 0.7,
    danceability: 0.2
  },
  melancholy: {
    valence: 0.25,
    energy: 0.35,
    acousticness: 0.6,
    danceability: 0.25
  },
  depressed: {
    valence: 0.15,
    energy: 0.25,
    acousticness: 0.8,
    danceability: 0.15
  },

  // Happy moods - high valence, high energy
  happy: {
    valence: 0.8,
    energy: 0.7,
    danceability: 0.6,
    acousticness: 0.3
  },
  joyful: {
    valence: 0.85,
    energy: 0.75,
    danceability: 0.7,
    acousticness: 0.25
  },
  excited: {
    valence: 0.9,
    energy: 0.9,
    danceability: 0.8,
    acousticness: 0.2
  },

  // Calm moods - moderate valence, low energy
  calm: {
    valence: 0.5,
    energy: 0.2,
    acousticness: 0.8,
    danceability: 0.3
  },
  peaceful: {
    valence: 0.6,
    energy: 0.15,
    acousticness: 0.85,
    danceability: 0.2
  },
  relaxed: {
    valence: 0.55,
    energy: 0.25,
    acousticness: 0.75,
    danceability: 0.25
  },

  // Energetic moods - high energy, high danceability
  energetic: {
    valence: 0.7,
    energy: 0.9,
    danceability: 0.8,
    acousticness: 0.2
  },
  pumped: {
    valence: 0.75,
    energy: 0.95,
    danceability: 0.85,
    acousticness: 0.15
  },
  motivated: {
    valence: 0.8,
    energy: 0.85,
    danceability: 0.7,
    acousticness: 0.25
  },

  // Romantic moods - moderate valence, low-moderate energy
  romantic: {
    valence: 0.6,
    energy: 0.4,
    acousticness: 0.6,
    danceability: 0.4
  },
  loving: {
    valence: 0.7,
    energy: 0.45,
    acousticness: 0.55,
    danceability: 0.45
  },
  intimate: {
    valence: 0.65,
    energy: 0.35,
    acousticness: 0.7,
    danceability: 0.3
  },

  // Angry moods - low valence, high energy
  angry: {
    valence: 0.2,
    energy: 0.9,
    danceability: 0.3,
    acousticness: 0.1
  },
  frustrated: {
    valence: 0.25,
    energy: 0.8,
    danceability: 0.35,
    acousticness: 0.15
  },
  aggressive: {
    valence: 0.15,
    energy: 0.95,
    danceability: 0.4,
    acousticness: 0.05
  },

  // Nostalgic moods - moderate valence, low-moderate energy
  nostalgic: {
    valence: 0.4,
    energy: 0.3,
    acousticness: 0.7,
    danceability: 0.3
  },
  wistful: {
    valence: 0.35,
    energy: 0.25,
    acousticness: 0.75,
    danceability: 0.25
  },
  sentimental: {
    valence: 0.45,
    energy: 0.35,
    acousticness: 0.65,
    danceability: 0.35
  },

  // Confident moods - high valence, high energy
  confident: {
    valence: 0.8,
    energy: 0.8,
    danceability: 0.7,
    acousticness: 0.2
  },
  powerful: {
    valence: 0.75,
    energy: 0.85,
    danceability: 0.65,
    acousticness: 0.15
  },
  determined: {
    valence: 0.7,
    energy: 0.75,
    danceability: 0.6,
    acousticness: 0.25
  },

  // Anxious moods - low valence, moderate energy
  anxious: {
    valence: 0.3,
    energy: 0.6,
    danceability: 0.4,
    acousticness: 0.5
  },
  nervous: {
    valence: 0.25,
    energy: 0.65,
    danceability: 0.35,
    acousticness: 0.55
  },
  worried: {
    valence: 0.2,
    energy: 0.5,
    danceability: 0.3,
    acousticness: 0.6
  },

  // Dreamy moods - moderate valence, low energy
  dreamy: {
    valence: 0.6,
    energy: 0.3,
    acousticness: 0.8,
    danceability: 0.2
  },
  ethereal: {
    valence: 0.65,
    energy: 0.25,
    acousticness: 0.85,
    danceability: 0.15
  },
  contemplative: {
    valence: 0.5,
    energy: 0.35,
    acousticness: 0.75,
    danceability: 0.25
  }
};

/**
 * Get audio features for a given mood
 * @param {string} mood - The mood to map
 * @returns {Object} Audio features object
 */
export function getMoodAudioFeatures(mood) {
  const normalizedMood = mood.toLowerCase().trim();
  
  // Check for exact matches first
  if (MOOD_MAPPINGS[normalizedMood]) {
    return MOOD_MAPPINGS[normalizedMood];
  }

  // Check for partial matches
  for (const [key, features] of Object.entries(MOOD_MAPPINGS)) {
    if (normalizedMood.includes(key) || key.includes(normalizedMood)) {
      return features;
    }
  }

  // Default to calm if no match found
  return MOOD_MAPPINGS.calm;
}

/**
 * Get all available mood options
 * @returns {string[]} Array of mood names
 */
export function getAvailableMoods() {
  return Object.keys(MOOD_MAPPINGS);
}