"use client"

import { useState } from "react"
import { Music, Headphones } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import MoodInput from "@/components/MoodInput"
import { SpotifyAuthProvider } from "@/lib/contexts/SpotifyAuthContext"



export default function MoodTunesApp() {
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  /**
   * Handle recommendations received from MoodInput component
   * @param {Object} recommendationData - The recommendation data from Spotify
   */
  const handleRecommendations = (recommendationData) => {
    // Transform Spotify data to display format
    const displayRecommendations = []
    
    // Add albums
    if (recommendationData.albums && recommendationData.albums.length > 0) {
      recommendationData.albums.slice(0, 6).forEach(album => {
        displayRecommendations.push({
          id: album.id,
          title: album.name,
          artist: album.artists[0]?.name || 'Unknown Artist',
          album: album.name,
          mood: `Perfect for ${recommendationData.mood} mood`,
          image: album.images[0]?.url || "/placeholder.svg",
          type: 'album',
          spotifyUrl: album.external_urls?.spotify
        })
      })
    }
    
    // Add tracks
    if (recommendationData.tracks && recommendationData.tracks.length > 0) {
      recommendationData.tracks.slice(0, 6).forEach(track => {
        displayRecommendations.push({
          id: track.id,
          title: track.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          album: track.album?.name || 'Unknown Album',
          mood: `Great for ${recommendationData.mood} vibes`,
          image: track.album?.images[0]?.url || "/placeholder.svg",
          type: 'track',
          spotifyUrl: track.external_urls?.spotify
        })
      })
    }
    
    setRecommendations(displayRecommendations)
    setError("")
  }

  /**
   * Handle errors from MoodInput component
   * @param {string} errorMessage - The error message
   */
  const handleError = (errorMessage) => {
    setError(errorMessage)
    setRecommendations([])
  }

  /**
   * Handle loading state changes from MoodInput component
   * @param {boolean} loading - Whether the component is loading
   */
  const handleLoadingChange = (loading) => {
    setIsLoading(loading)
  }

  return (
    <SpotifyAuthProvider>
      <div className="min-h-screen gradient-bg relative overflow-hidden">
        {/* Background overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12 pt-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Headphones className="w-8 h-8 text-white" />
              <h1 className="text-4xl md:text-6xl font-serif font-black text-white">Terera</h1>
            </div>
            <p className="text-xl text-white/90 font-sans">Discover music that resonates with you</p>
          </div>

          {/* Mood Input Section */}
          <MoodInput 
            onRecommendations={handleRecommendations}
            onError={handleError}
            onLoadingChange={handleLoadingChange}
          />

          {/* Error Display */}
          {error && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-center">
                {error}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-serif font-bold text-white text-center mb-8">Perfect for your mood</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                  <Card
                    key={rec.id || index}
                    className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square relative">
                        <img
                          src={rec.image || "/placeholder.svg"}
                          alt={`${rec.album} cover`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h3 className="font-serif font-bold text-xl mb-1">{rec.title}</h3>
                          <p className="font-sans text-white/90">{rec.artist}</p>
                        </div>
                        {rec.spotifyUrl && (
                          <div className="absolute top-4 right-4">
                            <a
                              href={rec.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors duration-200"
                              title="Open in Spotify"
                            >
                              <Music className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <p className="font-sans text-gray-600 mb-3">{rec.album}</p>
                        <p className="font-sans text-sm text-purple-600 font-medium">{rec.mood}</p>
                        <div className="mt-2">
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                            {rec.type === 'album' ? 'Album' : 'Track'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no search yet */}
          {recommendations.length === 0 && !isLoading && !error && (
            <div className="text-center text-white/80 max-w-md mx-auto">
              <Music className="w-16 h-16 mx-auto mb-4 opacity-60" />
              <p className="font-sans text-lg">
                Tell us how you're feeling and we'll find the perfect soundtrack for your mood
              </p>
            </div>
          )}
        </div>
      </div>
    </SpotifyAuthProvider>
  )
}
