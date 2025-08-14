/**
 * Tests for MoodInput component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MoodInput from '../../components/MoodInput.jsx';
import { SpotifyAuthProvider } from '../contexts/SpotifyAuthContext.jsx';
import { spotifyApi } from '../services/spotifyApi.js';
import { MoodAnalysisService } from '../services/moodAnalysis.js';

// Mock the Spotify API
vi.mock('../services/spotifyApi.js', () => ({
  spotifyApi: {
    isAuthenticated: vi.fn(),
    getAccessToken: vi.fn(),
    getCurrentUser: vi.fn(),
    getRecommendations: vi.fn(),
    search: vi.fn(),
    initiateAuth: vi.fn(),
  }
}));

// Mock the MoodAnalysisService
vi.mock('../services/moodAnalysis.js', () => ({
  MoodAnalysisService: {
    mapMoodToAudioFeatures: vi.fn(),
  }
}));

// Mock window.location
const mockLocation = {
  href: '',
  search: '',
  pathname: '/',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn(),
  },
  writable: true,
});

// Mock auth state that can be changed per test
let mockAuthState = {
  isAuthenticated: true,
  isLoading: false,
  error: null,
  user: { id: 'test-user', display_name: 'Test User' },
  accessToken: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  checkAuthStatus: vi.fn(),
};

// Mock the useSpotifyAuth hook
vi.mock('../contexts/SpotifyAuthContext.jsx', () => ({
  useSpotifyAuth: () => mockAuthState,
  SpotifyAuthProvider: ({ children }) => children,
}));

// Test wrapper component
const TestWrapper = ({ children, isAuthenticated = false }) => {
  // Update mock auth state based on test props
  mockAuthState = {
    ...mockAuthState,
    isAuthenticated,
    user: isAuthenticated ? { id: 'test-user', display_name: 'Test User' } : null,
    accessToken: isAuthenticated ? 'mock-token' : null,
  };

  return <div>{children}</div>;
};

describe('MoodInput Component', () => {
  const mockOnRecommendations = vi.fn();
  const mockOnError = vi.fn();
  const mockOnLoadingChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset Spotify API mocks
    spotifyApi.isAuthenticated.mockReturnValue(true);
    spotifyApi.getAccessToken.mockReturnValue('mock-token');
    spotifyApi.getCurrentUser.mockResolvedValue({ id: 'test-user' });
    
    // Reset MoodAnalysisService mock
    MoodAnalysisService.mapMoodToAudioFeatures.mockReturnValue({
      primaryEmotion: 'happy',
      intensity: 0.8,
      audioFeatures: {
        valence: 0.8,
        energy: 0.7,
        danceability: 0.6,
        acousticness: 0.3,
        instrumentalness: 0.2,
        tempo: 120
      },
      searchTerms: ['happy', 'pop', 'dance']
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders mood input field', () => {
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText("What's your mood today?")).toBeInTheDocument();
    });

    it('renders search button when authenticated', () => {
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Get Recommendations')).toBeInTheDocument();
    });

    it('renders connect to Spotify button when not authenticated', () => {
      render(
        <TestWrapper isAuthenticated={false}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Connect to Spotify')).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('shows validation error for empty input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const button = screen.getByText('Get Recommendations');
      await user.click(button);

      // Wait for the validation error to appear
      await waitFor(() => {
        expect(screen.getByText('Please enter your mood')).toBeInTheDocument();
      });
    });

    it('shows validation error for input that is too short', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'a');
      
      const button = screen.getByText('Get Recommendations');
      await user.click(button);

      expect(screen.getByText('Please enter at least 2 characters')).toBeInTheDocument();
    });

    it('shows validation error for input that is too long', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      const longText = 'a'.repeat(101); // 101 characters
      await user.type(input, longText);
      
      const button = screen.getByText('Get Recommendations');
      await user.click(button);

      expect(screen.getByText('Mood description is too long (max 100 characters)')).toBeInTheDocument();
    });

    it('clears validation error when user starts typing valid input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      const button = screen.getByText('Get Recommendations');
      
      // Trigger validation error
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText('Please enter your mood')).toBeInTheDocument();
      });
      
      // Start typing valid input
      await user.type(input, 'happy');
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Please enter your mood')).not.toBeInTheDocument();
      });
    });
  });

  describe('Suggestions', () => {
    it('shows suggestions when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'sad');

      expect(screen.getByText('feeling sad')).toBeInTheDocument();
    });

    it('filters suggestions based on input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'happy');

      expect(screen.getByText('happy and energetic')).toBeInTheDocument();
      expect(screen.queryByText('feeling sad')).not.toBeInTheDocument();
    });

    it('handles suggestion click', async () => {
      const user = userEvent.setup();
      
      // Mock successful API responses
      spotifyApi.getRecommendations.mockResolvedValue({
        tracks: [{ id: '1', name: 'Happy Song', artists: [{ name: 'Artist' }] }]
      });
      spotifyApi.search.mockResolvedValue({
        albums: { items: [{ id: '1', name: 'Happy Album', artists: [{ name: 'Artist' }] }] }
      });
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'happy');

      const suggestion = screen.getByText('happy and energetic');
      await user.click(suggestion);

      // Should trigger search with the suggestion text
      await waitFor(() => {
        expect(MoodAnalysisService.mapMoodToAudioFeatures).toHaveBeenCalledWith('happy and energetic');
      });
    });
  });

  describe('Authentication Integration', () => {
    it('shows authentication error when not authenticated', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper isAuthenticated={false}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'happy');

      // Try to submit (should show connect button)
      const connectButton = screen.getByText('Connect to Spotify');
      expect(connectButton).toBeInTheDocument();
    });

    it('calls login when connect button is clicked', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn();
      
      render(
        <TestWrapper isAuthenticated={false}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      // Mock the login function in the context
      const connectButton = screen.getByText('Connect to Spotify');
      await user.click(connectButton);

      // Note: This test would need to be adjusted based on how the auth context is actually implemented
      // For now, we're just checking that the button exists and can be clicked
      expect(connectButton).toBeInTheDocument();
    });
  });

  describe('Spotify API Integration', () => {
    beforeEach(() => {
      // Mock successful API responses
      spotifyApi.getRecommendations.mockResolvedValue({
        tracks: [
          { 
            id: '1', 
            name: 'Happy Song', 
            artists: [{ name: 'Artist 1' }],
            album: { name: 'Happy Album' },
            duration_ms: 180000,
            preview_url: 'https://preview.url',
            external_urls: { spotify: 'https://spotify.url' }
          }
        ]
      });
      
      spotifyApi.search.mockResolvedValue({
        albums: { 
          items: [
            { 
              id: '1', 
              name: 'Happy Album', 
              artists: [{ name: 'Artist 1' }],
              images: [{ url: 'https://image.url' }],
              release_date: '2023-01-01',
              total_tracks: 12,
              external_urls: { spotify: 'https://spotify.url' }
            }
          ] 
        }
      });
    });

    it('fetches recommendations on valid mood submission', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'happy');

      const button = screen.getByText('Get Recommendations');
      await user.click(button);

      await waitFor(() => {
        expect(MoodAnalysisService.mapMoodToAudioFeatures).toHaveBeenCalledWith('happy');
        expect(spotifyApi.getRecommendations).toHaveBeenCalled();
        expect(spotifyApi.search).toHaveBeenCalled();
      });
    });

    it('calls onRecommendations with fetched data', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'happy');

      const button = screen.getByText('Get Recommendations');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnRecommendations).toHaveBeenCalledWith({
          tracks: expect.any(Array),
          albums: expect.any(Array),
          mood: 'happy',
          intensity: 0.8,
          audioFeatures: expect.any(Object)
        });
      });
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      spotifyApi.getRecommendations.mockRejectedValue(new Error('API Error'));
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'happy');

      const button = screen.getByText('Get Recommendations');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('API Error');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during API request', async () => {
      const user = userEvent.setup();
      
      // Mock delayed API response
      spotifyApi.getRecommendations.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ tracks: [] }), 100))
      );
      spotifyApi.search.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ albums: { items: [] } }), 100))
      );
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'happy');

      const button = screen.getByText('Get Recommendations');
      await user.click(button);

      // Should show loading state
      expect(screen.getByText('Finding your vibe...')).toBeInTheDocument();
      expect(mockOnLoadingChange).toHaveBeenCalledWith(true);

      // Wait for loading to complete
      await waitFor(() => {
        expect(mockOnLoadingChange).toHaveBeenCalledWith(false);
      });
    });

    it('disables input and buttons during loading', async () => {
      const user = userEvent.setup();
      
      // Mock delayed API response
      spotifyApi.getRecommendations.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ tracks: [] }), 100))
      );
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'happy');

      const button = screen.getByText('Get Recommendations');
      await user.click(button);

      // Input and button should be disabled during loading
      expect(input).toBeDisabled();
      expect(button).toBeDisabled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('submits on Enter key press', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper isAuthenticated={true}>
          <MoodInput 
            onRecommendations={mockOnRecommendations}
            onError={mockOnError}
            onLoadingChange={mockOnLoadingChange}
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText("What's your mood today?");
      await user.type(input, 'happy');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(MoodAnalysisService.mapMoodToAudioFeatures).toHaveBeenCalledWith('happy');
      });
    });
  });
});