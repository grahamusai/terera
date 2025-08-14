/**
 * Mood Analysis Service
 * Maps user mood inputs to Spotify audio features for music recommendations
 */

/**
 * Predefined mood mappings to Spotify audio features
 * Based on psychological research and music theory
 */
const MOOD_MAPPINGS = {
  // Basic emotions
  sad: { 
    valence: 0.2, 
    energy: 0.3, 
    acousticness: 0.7, 
    danceability: 0.2,
    instrumentalness: 0.4,
    tempo: 80
  },
  happy: { 
    valence: 0.8, 
    energy: 0.7, 
    danceability: 0.6,
    acousticness: 0.3,
    instrumentalness: 0.2,
    tempo: 120
  },
  calm: { 
    valence: 0.5, 
    energy: 0.2, 
    acousticness: 0.8,
    danceability: 0.2,
    instrumentalness: 0.6,
    tempo: 70
  },
  energetic: { 
    valence: 0.7, 
    energy: 0.9, 
    danceability: 0.8,
    acousticness: 0.2,
    instrumentalness: 0.1,
    tempo: 140
  },
  
  // Complex emotions
  romantic: { 
    valence: 0.6, 
    energy: 0.4, 
    acousticness: 0.6,
    danceability: 0.3,
    instrumentalness: 0.3,
    tempo: 90
  },
  angry: { 
    valence: 0.2, 
    energy: 0.9, 
    danceability: 0.3,
    acousticness: 0.1,
    instrumentalness: 0.2,
    tempo: 150
  },
  nostalgic: { 
    valence: 0.4, 
    energy: 0.3, 
    acousticness: 0.7,
    danceability: 0.2,
    instrumentalness: 0.4,
    tempo: 85
  },
  confident: { 
    valence: 0.8, 
    energy: 0.8, 
    danceability: 0.7,
    acousticness: 0.2,
    instrumentalness: 0.1,
    tempo: 130
  },
  
  // Additional moods
  melancholy: { 
    valence: 0.3, 
    energy: 0.2, 
    acousticness: 0.8,
    danceability: 0.1,
    instrumentalness: 0.5,
    tempo: 75
  },
  excited: { 
    valence: 0.9, 
    energy: 0.9, 
    danceability: 0.8,
    acousticness: 0.1,
    instrumentalness: 0.1,
    tempo: 145
  },
  peaceful: { 
    valence: 0.6, 
    energy: 0.1, 
    acousticness: 0.9,
    danceability: 0.1,
    instrumentalness: 0.7,
    tempo: 60
  },
  anxious: { 
    valence: 0.3, 
    energy: 0.6, 
    acousticness: 0.4,
    danceability: 0.3,
    instrumentalness: 0.3,
    tempo: 110
  },
  focused: { 
    valence: 0.5, 
    energy: 0.4, 
    acousticness: 0.5,
    danceability: 0.2,
    instrumentalness: 0.8,
    tempo: 100
  },
  dreamy: { 
    valence: 0.6, 
    energy: 0.3, 
    acousticness: 0.6,
    danceability: 0.2,
    instrumentalness: 0.5,
    tempo: 85
  }
};

/**
 * Mood synonyms for fuzzy matching
 */
const MOOD_SYNONYMS = {
  // Sad variations
  depressed: 'sad',
  down: 'sad',
  blue: 'sad',
  gloomy: 'sad',
  sorrowful: 'sad',
  heartbroken: 'sad',
  
  // Happy variations
  joyful: 'happy',
  cheerful: 'happy',
  upbeat: 'happy',
  elated: 'happy',
  euphoric: 'happy',
  blissful: 'happy',
  
  // Calm variations
  relaxed: 'calm',
  serene: 'calm',
  tranquil: 'calm',
  mellow: 'calm',
  chill: 'calm',
  zen: 'calm',
  
  // Energetic variations
  pumped: 'energetic',
  hyper: 'energetic',
  active: 'energetic',
  dynamic: 'energetic',
  vigorous: 'energetic',
  
  // Romantic variations
  loving: 'romantic',
  passionate: 'romantic',
  intimate: 'romantic',
  tender: 'romantic',
  
  // Angry variations
  mad: 'angry',
  furious: 'angry',
  rage: 'angry',
  irritated: 'angry',
  frustrated: 'angry',
  
  // Nostalgic variations
  wistful: 'nostalgic',
  sentimental: 'nostalgic',
  reminiscent: 'nostalgic',
  
  // Confident variations
  bold: 'confident',
  strong: 'confident',
  powerful: 'confident',
  determined: 'confident'
};

/**
 * Calculate string similarity using Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Find the best matching mood using fuzzy matching
 * @param {string} inputMood - User input mood
 * @param {number} threshold - Minimum similarity threshold (default: 0.6)
 * @returns {string|null} Best matching mood or null if no good match
 */
function findBestMoodMatch(inputMood, threshold = 0.6) {
  const normalizedInput = inputMood.toLowerCase().trim();
  
  // First check exact matches in synonyms
  if (MOOD_SYNONYMS[normalizedInput]) {
    return MOOD_SYNONYMS[normalizedInput];
  }
  
  // Then check exact matches in main moods
  if (MOOD_MAPPINGS[normalizedInput]) {
    return normalizedInput;
  }
  
  // Fuzzy matching against main moods
  let bestMatch = null;
  let bestScore = 0;
  
  const allMoods = [...Object.keys(MOOD_MAPPINGS), ...Object.keys(MOOD_SYNONYMS)];
  
  for (const mood of allMoods) {
    const similarity = calculateSimilarity(normalizedInput, mood);
    if (similarity > bestScore && similarity >= threshold) {
      bestScore = similarity;
      bestMatch = MOOD_SYNONYMS[mood] || mood;
    }
  }
  
  return bestMatch;
}

/**
 * Generate search terms based on mood
 * @param {string} mood - The mood to generate terms for
 * @returns {string[]} Array of search terms
 */
function generateSearchTerms(mood) {
  const baseTerms = [mood];
  
  // Add genre-based terms based on mood characteristics
  const features = MOOD_MAPPINGS[mood];
  if (!features) return baseTerms;
  
  const terms = [...baseTerms];
  
  // Add genre suggestions based on audio features
  if (features.valence < 0.4) {
    terms.push('indie', 'alternative', 'folk');
  } else if (features.valence > 0.7) {
    terms.push('pop', 'dance', 'funk');
  }
  
  if (features.energy > 0.7) {
    terms.push('rock', 'electronic', 'hip-hop');
  } else if (features.energy < 0.3) {
    terms.push('ambient', 'classical', 'jazz');
  }
  
  if (features.acousticness > 0.6) {
    terms.push('acoustic', 'singer-songwriter');
  }
  
  return terms;
}

/**
 * Main mood analysis service
 */
export class MoodAnalysisService {
  /**
   * Map a mood input to Spotify audio features
   * @param {string} moodInput - User's mood input
   * @returns {import('../types/spotify.js').MoodAnalysis} Mood analysis result
   */
  static mapMoodToAudioFeatures(moodInput) {
    if (!moodInput || typeof moodInput !== 'string') {
      throw new Error('Mood input must be a non-empty string');
    }
    
    const matchedMood = findBestMoodMatch(moodInput);
    
    if (!matchedMood) {
      // Return a neutral mood if no match found
      const neutralFeatures = {
        valence: 0.5,
        energy: 0.5,
        danceability: 0.5,
        acousticness: 0.5,
        instrumentalness: 0.5,
        tempo: 100
      };
      
      return {
        primaryEmotion: 'neutral',
        intensity: 0.5,
        audioFeatures: neutralFeatures,
        searchTerms: [moodInput.toLowerCase()]
      };
    }
    
    const audioFeatures = MOOD_MAPPINGS[matchedMood];
    const searchTerms = generateSearchTerms(matchedMood);
    
    // Calculate intensity based on how specific the mood match was
    const normalizedInput = moodInput.toLowerCase().trim();
    let intensity;
    
    // Higher intensity for exact matches and synonyms
    if (MOOD_MAPPINGS[normalizedInput] || MOOD_SYNONYMS[normalizedInput]) {
      intensity = 0.9; // High intensity for exact matches and synonyms
    } else {
      // For fuzzy matches, use similarity score
      const similarity = calculateSimilarity(normalizedInput, matchedMood);
      intensity = Math.min(similarity + 0.2, 1.0); // Boost intensity slightly
    }
    
    return {
      primaryEmotion: matchedMood,
      intensity,
      audioFeatures,
      searchTerms
    };
  }
  
  /**
   * Get all available mood mappings
   * @returns {Object} All mood mappings
   */
  static getAllMoodMappings() {
    return { ...MOOD_MAPPINGS };
  }
  
  /**
   * Get all mood synonyms
   * @returns {Object} All mood synonyms
   */
  static getAllMoodSynonyms() {
    return { ...MOOD_SYNONYMS };
  }
  
  /**
   * Check if a mood is directly supported
   * @param {string} mood - Mood to check
   * @returns {boolean} Whether the mood is supported
   */
  static isMoodSupported(mood) {
    const normalizedMood = mood.toLowerCase().trim();
    return !!(MOOD_MAPPINGS[normalizedMood] || MOOD_SYNONYMS[normalizedMood]);
  }
  
  /**
   * Get suggested moods for autocomplete
   * @param {string} partial - Partial mood input
   * @returns {string[]} Array of suggested moods
   */
  static getSuggestedMoods(partial) {
    if (!partial || partial.length < 2) {
      return Object.keys(MOOD_MAPPINGS).slice(0, 8); // Return first 8 main moods
    }
    
    const normalizedPartial = partial.toLowerCase();
    const allMoods = [...Object.keys(MOOD_MAPPINGS), ...Object.keys(MOOD_SYNONYMS)];
    
    return allMoods
      .filter(mood => mood.toLowerCase().includes(normalizedPartial))
      .map(mood => MOOD_SYNONYMS[mood] || mood)
      .filter((mood, index, arr) => arr.indexOf(mood) === index) // Remove duplicates
      .slice(0, 8);
  }
}

export default MoodAnalysisService;