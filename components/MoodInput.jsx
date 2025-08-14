"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useSpotifyAuth } from "@/lib/contexts/SpotifyAuthContext"
import { MoodAnalysisService } from "@/lib/services/moodAnalysis"
import { spotifyApi } from "@/lib/services/spotifyApi"

const moodSuggestions = [
  { text: "feeling sad", icon: "😢", color: "text-blue-400" },
  { text: "happy and energetic", icon: "😄", color: "text-yellow-400" },
  { text: "chill and relaxed", icon: "😌", color: "text-green-400" },
  { text: "romantic mood", icon: "💕", color: "text-pink-400" },
  { text: "need motivation", icon: "💪", color: "text-orange-400" },
  { text: "studying focus", icon: "📚", color: "text-purple-400" },
  { text: "party vibes", icon: "🎉", color: "text-red-400" },
  { text: "nostalgic", icon: "🌅", color: "text-amber-400" },
  { text: "anxious", icon: "😰", color: "text-gray-400" },
  { text: "confident", icon: "😎", color: "text-indigo-400" },
]

/**
 * MoodInput Component
 * Handles mood input with Spotify integration for music recommendations
 */
export default function MoodInput({ onRecommendations, onError, onLoadingChange }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState(moodSuggestions)
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState("")
  const inputRef = useRef(null)
  
  const { isAuthenticated, login } = useSpotifyAuth()

  // Filter suggestions based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = moodSuggestions.filter((suggestion) =>
        suggestion.text.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [searchQuery])

  // Notify parent component of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading)
    }
  }, [isLoading, onLoadingChange])

  /**
   * Validate mood input
   * @param {string} mood - The mood to validate
   * @returns {boolean} Whether the mood is valid
   */
  const validateMoodInput = (mood) => {
    if (!mood || typeof mood !== 'string') {
      setValidationError("Please enter your mood")
      return false
    }

    const trimmedMood = mood.trim()
    if (trimmedMood.length === 0) {
      setValidationError("Please enter your mood")
      return false
    }

    if (trimmedMood.length < 2) {
      setValidationError("Please enter at least 2 characters")
      return false
    }

    if (trimmedMood.length > 100) {
      setValidationError("Mood description is too long (max 100 characters)")
      return false
    }

    setValidationError("")
    return true
  }

  /**
   * Fetch recommendations from Spotify based on mood
   * @param {string} mood - The user's mood
   */
  const fetchRecommendations = async (mood) => {
    try {
      setIsLoading(true)
      
      // Use the new recommendation service
      const { recommendationService } = await import('../lib/services/recommendationService.js')
      const result = await recommendationService.getRecommendationsByMood(mood, { limit: 20 })
      
      // Format the results for the existing interface
      const recommendations = {
        tracks: [
          ...(result.recommendations.tracks || []),
          ...(result.searchResults.tracks || [])
        ],
        albums: [
          ...(result.recommendations.albums || []),
          ...(result.searchResults.albums || [])
        ],
        mood: result.mood,
        audioFeatures: result.audioFeatures
      }

      if (onRecommendations) {
        onRecommendations(recommendations)
      }

    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
      const errorMessage = error.message || 'Failed to get recommendations. Please try again.'
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle mood search submission
   * @param {string} query - The mood query (optional, defaults to current searchQuery)
   */
  const handleSearch = async (query = searchQuery) => {
    // Validate input
    if (!validateMoodInput(query)) {
      return
    }

    // Clear validation errors only after successful validation
    setValidationError("")

    // Check authentication
    if (!isAuthenticated) {
      if (onError) {
        onError("Please log in to Spotify to get personalized recommendations")
      }
      return
    }

    setShowSuggestions(false)
    await fetchRecommendations(query.trim())
  }

  /**
   * Handle suggestion click
   * @param {Object} suggestion - The selected suggestion
   */
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.text)
    setShowSuggestions(false)
    handleSearch(suggestion.text)
  }

  /**
   * Handle key press events
   * @param {KeyboardEvent} e - The keyboard event
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  /**
   * Handle input change
   * @param {Event} e - The input change event
   */
  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Clear validation error when user starts typing
    if (validationError && value.trim().length > 0) {
      setValidationError("")
    }
  }

  /**
   * Handle authentication requirement
   */
  const handleAuthRequired = () => {
    login()
  }

  return (
    <div className="max-w-2xl mx-auto mb-16">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="What's your mood today?"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
            className={`pl-12 pr-4 py-6 text-lg bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-2xl focus:ring-2 focus:ring-purple-500 font-sans ${
              validationError ? 'ring-2 ring-red-500' : ''
            }`}
            disabled={isLoading}
          />
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mt-2 text-red-500 text-sm font-sans">
            {validationError}
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <Card className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden z-20">
            <CardContent className="p-0">
              {filteredSuggestions.slice(0, 6).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-6 py-4 text-left hover:bg-purple-50 transition-colors duration-200 flex items-center gap-3 suggestion-item font-sans"
                  style={{ animationDelay: `${index * 50}ms` }}
                  disabled={isLoading}
                >
                  <span className="text-2xl">{suggestion.icon}</span>
                  <span className="text-gray-700 capitalize">{suggestion.text}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="text-center mt-6">
        {!isAuthenticated ? (
          <Button
            onClick={handleAuthRequired}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-sans font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Music className="w-4 h-4 mr-2" />
            Connect to Spotify
          </Button>
        ) : (
          <Button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-sans font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 animate-bounce" />
                Finding your vibe...
              </div>
            ) : (
              "Get Recommendations"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}