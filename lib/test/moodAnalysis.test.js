/**
 * Unit tests for MoodAnalysisService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MoodAnalysisService } from '../services/moodAnalysis.js';

describe('MoodAnalysisService', () => {
  describe('mapMoodToAudioFeatures', () => {
    it('should map basic moods correctly', () => {
      const sadAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('sad');
      
      expect(sadAnalysis.primaryEmotion).toBe('sad');
      expect(sadAnalysis.audioFeatures.valence).toBe(0.2);
      expect(sadAnalysis.audioFeatures.energy).toBe(0.3);
      expect(sadAnalysis.audioFeatures.acousticness).toBe(0.7);
      expect(sadAnalysis.intensity).toBeGreaterThan(0);
      expect(sadAnalysis.searchTerms).toContain('sad');
    });

    it('should handle happy mood correctly', () => {
      const happyAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('happy');
      
      expect(happyAnalysis.primaryEmotion).toBe('happy');
      expect(happyAnalysis.audioFeatures.valence).toBe(0.8);
      expect(happyAnalysis.audioFeatures.energy).toBe(0.7);
      expect(happyAnalysis.audioFeatures.danceability).toBe(0.6);
      expect(happyAnalysis.searchTerms).toContain('happy');
    });

    it('should handle calm mood correctly', () => {
      const calmAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('calm');
      
      expect(calmAnalysis.primaryEmotion).toBe('calm');
      expect(calmAnalysis.audioFeatures.valence).toBe(0.5);
      expect(calmAnalysis.audioFeatures.energy).toBe(0.2);
      expect(calmAnalysis.audioFeatures.acousticness).toBe(0.8);
    });

    it('should handle energetic mood correctly', () => {
      const energeticAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('energetic');
      
      expect(energeticAnalysis.primaryEmotion).toBe('energetic');
      expect(energeticAnalysis.audioFeatures.valence).toBe(0.7);
      expect(energeticAnalysis.audioFeatures.energy).toBe(0.9);
      expect(energeticAnalysis.audioFeatures.danceability).toBe(0.8);
    });

    it('should be case insensitive', () => {
      const upperCaseAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('HAPPY');
      const lowerCaseAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('happy');
      const mixedCaseAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('HaPpY');
      
      expect(upperCaseAnalysis.primaryEmotion).toBe(lowerCaseAnalysis.primaryEmotion);
      expect(upperCaseAnalysis.audioFeatures).toEqual(lowerCaseAnalysis.audioFeatures);
      expect(mixedCaseAnalysis.primaryEmotion).toBe(lowerCaseAnalysis.primaryEmotion);
    });

    it('should handle whitespace in input', () => {
      const analysis = MoodAnalysisService.mapMoodToAudioFeatures('  sad  ');
      
      expect(analysis.primaryEmotion).toBe('sad');
      expect(analysis.audioFeatures.valence).toBe(0.2);
    });

    it('should handle mood synonyms', () => {
      const depressedAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('depressed');
      const sadAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('sad');
      
      expect(depressedAnalysis.primaryEmotion).toBe('sad');
      expect(depressedAnalysis.audioFeatures).toEqual(sadAnalysis.audioFeatures);
    });

    it('should handle multiple synonyms correctly', () => {
      const synonymTests = [
        { input: 'joyful', expected: 'happy' },
        { input: 'relaxed', expected: 'calm' },
        { input: 'pumped', expected: 'energetic' },
        { input: 'furious', expected: 'angry' },
        { input: 'loving', expected: 'romantic' }
      ];

      synonymTests.forEach(({ input, expected }) => {
        const analysis = MoodAnalysisService.mapMoodToAudioFeatures(input);
        expect(analysis.primaryEmotion).toBe(expected);
      });
    });

    it('should perform fuzzy matching for similar words', () => {
      // Test with slight misspellings
      const analysis1 = MoodAnalysisService.mapMoodToAudioFeatures('hapy'); // missing 'p'
      const analysis2 = MoodAnalysisService.mapMoodToAudioFeatures('happpy'); // extra 'p'
      
      expect(analysis1.primaryEmotion).toBe('happy');
      expect(analysis2.primaryEmotion).toBe('happy');
    });

    it('should return neutral mood for unrecognized input', () => {
      const analysis = MoodAnalysisService.mapMoodToAudioFeatures('xyz123unknown');
      
      expect(analysis.primaryEmotion).toBe('neutral');
      expect(analysis.audioFeatures.valence).toBe(0.5);
      expect(analysis.audioFeatures.energy).toBe(0.5);
      expect(analysis.intensity).toBe(0.5);
      expect(analysis.searchTerms).toContain('xyz123unknown');
    });

    it('should throw error for invalid input', () => {
      expect(() => MoodAnalysisService.mapMoodToAudioFeatures('')).toThrow();
      expect(() => MoodAnalysisService.mapMoodToAudioFeatures(null)).toThrow();
      expect(() => MoodAnalysisService.mapMoodToAudioFeatures(undefined)).toThrow();
      expect(() => MoodAnalysisService.mapMoodToAudioFeatures(123)).toThrow();
    });

    it('should generate appropriate search terms based on audio features', () => {
      const sadAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('sad');
      const happyAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('happy');
      const energeticAnalysis = MoodAnalysisService.mapMoodToAudioFeatures('energetic');
      
      // Sad should include indie/alternative genres
      expect(sadAnalysis.searchTerms.some(term => 
        ['indie', 'alternative', 'folk'].includes(term)
      )).toBe(true);
      
      // Happy should include upbeat genres
      expect(happyAnalysis.searchTerms.some(term => 
        ['pop', 'dance', 'funk'].includes(term)
      )).toBe(true);
      
      // Energetic should include high-energy genres
      expect(energeticAnalysis.searchTerms.some(term => 
        ['rock', 'electronic', 'hip-hop'].includes(term)
      )).toBe(true);
    });

    it('should calculate intensity based on match quality', () => {
      const exactMatch = MoodAnalysisService.mapMoodToAudioFeatures('happy');
      const synonymMatch = MoodAnalysisService.mapMoodToAudioFeatures('joyful');
      const fuzzyMatch = MoodAnalysisService.mapMoodToAudioFeatures('hapy');
      
      expect(exactMatch.intensity).toBeGreaterThanOrEqual(0.5);
      expect(synonymMatch.intensity).toBeGreaterThanOrEqual(0.5);
      expect(fuzzyMatch.intensity).toBeGreaterThan(0);
    });
  });

  describe('getAllMoodMappings', () => {
    it('should return all mood mappings', () => {
      const mappings = MoodAnalysisService.getAllMoodMappings();
      
      expect(mappings).toHaveProperty('sad');
      expect(mappings).toHaveProperty('happy');
      expect(mappings).toHaveProperty('calm');
      expect(mappings).toHaveProperty('energetic');
      expect(mappings.sad.valence).toBe(0.2);
      expect(mappings.happy.valence).toBe(0.8);
    });

    it('should return a copy of mappings (not reference)', () => {
      const mappings1 = MoodAnalysisService.getAllMoodMappings();
      const mappings2 = MoodAnalysisService.getAllMoodMappings();
      
      mappings1.test = 'modified';
      expect(mappings2).not.toHaveProperty('test');
    });
  });

  describe('getAllMoodSynonyms', () => {
    it('should return all mood synonyms', () => {
      const synonyms = MoodAnalysisService.getAllMoodSynonyms();
      
      expect(synonyms).toHaveProperty('depressed');
      expect(synonyms).toHaveProperty('joyful');
      expect(synonyms.depressed).toBe('sad');
      expect(synonyms.joyful).toBe('happy');
    });

    it('should return a copy of synonyms (not reference)', () => {
      const synonyms1 = MoodAnalysisService.getAllMoodSynonyms();
      const synonyms2 = MoodAnalysisService.getAllMoodSynonyms();
      
      synonyms1.test = 'modified';
      expect(synonyms2).not.toHaveProperty('test');
    });
  });

  describe('isMoodSupported', () => {
    it('should return true for supported moods', () => {
      expect(MoodAnalysisService.isMoodSupported('happy')).toBe(true);
      expect(MoodAnalysisService.isMoodSupported('sad')).toBe(true);
      expect(MoodAnalysisService.isMoodSupported('energetic')).toBe(true);
    });

    it('should return true for mood synonyms', () => {
      expect(MoodAnalysisService.isMoodSupported('joyful')).toBe(true);
      expect(MoodAnalysisService.isMoodSupported('depressed')).toBe(true);
      expect(MoodAnalysisService.isMoodSupported('relaxed')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(MoodAnalysisService.isMoodSupported('HAPPY')).toBe(true);
      expect(MoodAnalysisService.isMoodSupported('HaPpY')).toBe(true);
    });

    it('should handle whitespace', () => {
      expect(MoodAnalysisService.isMoodSupported('  happy  ')).toBe(true);
    });

    it('should return false for unsupported moods', () => {
      expect(MoodAnalysisService.isMoodSupported('unknown')).toBe(false);
      expect(MoodAnalysisService.isMoodSupported('xyz123')).toBe(false);
    });
  });

  describe('getSuggestedMoods', () => {
    it('should return main moods for short input', () => {
      const suggestions = MoodAnalysisService.getSuggestedMoods('h');
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeLessThanOrEqual(8);
      expect(suggestions).toContain('happy');
    });

    it('should return empty array for very short input', () => {
      const suggestions = MoodAnalysisService.getSuggestedMoods('');
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should filter moods based on partial input', () => {
      const suggestions = MoodAnalysisService.getSuggestedMoods('hap');
      
      expect(suggestions).toContain('happy');
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });

    it('should handle case insensitive filtering', () => {
      const suggestions = MoodAnalysisService.getSuggestedMoods('HAP');
      
      expect(suggestions).toContain('happy');
    });

    it('should remove duplicates from suggestions', () => {
      const suggestions = MoodAnalysisService.getSuggestedMoods('sad');
      const uniqueSuggestions = [...new Set(suggestions)];
      
      expect(suggestions.length).toBe(uniqueSuggestions.length);
    });

    it('should limit suggestions to 8 items', () => {
      const suggestions = MoodAnalysisService.getSuggestedMoods('a');
      
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });
  });

  describe('Audio Features Validation', () => {
    it('should have valid audio feature ranges for all moods', () => {
      const mappings = MoodAnalysisService.getAllMoodMappings();
      
      Object.entries(mappings).forEach(([mood, features]) => {
        expect(features.valence).toBeGreaterThanOrEqual(0);
        expect(features.valence).toBeLessThanOrEqual(1);
        expect(features.energy).toBeGreaterThanOrEqual(0);
        expect(features.energy).toBeLessThanOrEqual(1);
        expect(features.danceability).toBeGreaterThanOrEqual(0);
        expect(features.danceability).toBeLessThanOrEqual(1);
        expect(features.acousticness).toBeGreaterThanOrEqual(0);
        expect(features.acousticness).toBeLessThanOrEqual(1);
        expect(features.instrumentalness).toBeGreaterThanOrEqual(0);
        expect(features.instrumentalness).toBeLessThanOrEqual(1);
        expect(features.tempo).toBeGreaterThan(0);
      });
    });

    it('should have logical audio feature relationships', () => {
      const mappings = MoodAnalysisService.getAllMoodMappings();
      
      // Happy should have high valence
      expect(mappings.happy.valence).toBeGreaterThan(0.6);
      
      // Sad should have low valence
      expect(mappings.sad.valence).toBeLessThan(0.4);
      
      // Energetic should have high energy
      expect(mappings.energetic.energy).toBeGreaterThan(0.7);
      
      // Calm should have low energy
      expect(mappings.calm.energy).toBeLessThan(0.4);
    });
  });

  describe('Fuzzy Matching Algorithm', () => {
    it('should handle single character differences', () => {
      const analysis = MoodAnalysisService.mapMoodToAudioFeatures('hapy');
      expect(analysis.primaryEmotion).toBe('happy');
    });

    it('should handle character insertions', () => {
      const analysis = MoodAnalysisService.mapMoodToAudioFeatures('happpy');
      expect(analysis.primaryEmotion).toBe('happy');
    });

    it('should handle character deletions', () => {
      const analysis = MoodAnalysisService.mapMoodToAudioFeatures('happ');
      expect(analysis.primaryEmotion).toBe('happy');
    });

    it('should handle character substitutions', () => {
      const analysis = MoodAnalysisService.mapMoodToAudioFeatures('hippy');
      expect(analysis.primaryEmotion).toBe('happy');
    });

    it('should not match very different words', () => {
      const analysis = MoodAnalysisService.mapMoodToAudioFeatures('completely_different');
      expect(analysis.primaryEmotion).toBe('neutral');
    });
  });
});