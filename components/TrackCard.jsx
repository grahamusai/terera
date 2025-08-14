"use client"

import React, { useState, useRef, useEffect } from "react"
import { Music, Play, Pause, ExternalLink, Clock, Volume2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

/**
 * TrackCard Component
 * Displays Spotify track data with artwork, metadata, and play/preview functionality
 */
export default function TrackCard({ track, mood, onTrackClick }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const audioRef = useRef(null)

  /**
   * Handle track click - opens Spotify link or triggers custom handler
   */
  const handleTrackClick = () => {
    if (onTrackClick) {
      onTrackClick(track)
    } else if (track.external_urls?.spotify) {
      window.open(track.external_urls.spotify, '_blank', 'noopener,noreferrer')
    }
  }

  /**
   * Handle play/pause functionality for preview
   */
  const handlePlayPause = async (e) => {
    e.stopPropagation()
    
    if (!track.preview_url) {
      // If no preview, open in Spotify
      if (track.external_urls?.spotify) {
        window.open(track.external_urls.spotify, '_blank', 'noopener,noreferrer')
      }
      return
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(track.preview_url)
      audioRef.current.volume = 0.7
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
      })
      
      audioRef.current.addEventListener('error', () => {
        setHasError(true)
        setIsLoading(false)
        setIsPlaying(false)
      })
      
      audioRef.current.addEventListener('loadstart', () => {
        setIsLoading(true)
      })
      
      audioRef.current.addEventListener('canplay', () => {
        setIsLoading(false)
      })
    }

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        setIsLoading(true)
        await audioRef.current.play()
        setIsPlaying(true)
        setHasError(false)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      setHasError(true)
      setIsLoading(false)
      setIsPlaying(false)
    }
  }

  /**
   * Cleanup audio on unmount
   */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  /**
   * Format track duration
   */
  const formatDuration = (ms) => {
    if (!ms) return '0:00'
    
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  /**
   * Get track artwork URL with fallback
   */
  const getTrackArtwork = () => {
    if (track.album?.images && track.album.images.length > 0) {
      // Use medium size image (usually index 1) or largest available
      return track.album.images[1]?.url || track.album.images[0]?.url
    }
    return "/placeholder.svg"
  }

  /**
   * Get primary artist name
   */
  const getPrimaryArtist = () => {
    if (track.artists && track.artists.length > 0) {
      return track.artists[0].name
    }
    return 'Unknown Artist'
  }

  /**
   * Get all artist names formatted
   */
  const getAllArtists = () => {
    if (track.artists && track.artists.length > 0) {
      return track.artists.map(artist => artist.name).join(', ')
    }
    return 'Unknown Artist'
  }

  /**
   * Get play button content based on state
   */
  const getPlayButtonContent = () => {
    if (isLoading) {
      return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    }
    
    if (hasError || !track.preview_url) {
      return <ExternalLink className="w-4 h-4" />
    }
    
    return isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />
  }

  /**
   * Get play button title based on state
   */
  const getPlayButtonTitle = () => {
    if (hasError) return "Error playing preview"
    if (!track.preview_url) return "Open in Spotify"
    return isPlaying ? "Pause preview" : "Play preview"
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group">
      <CardContent className="p-0">
        {/* Track Artwork Section */}
        <div className="aspect-square relative overflow-hidden">
          <img
            src={getTrackArtwork()}
            alt={`${track.album?.name || track.name} cover`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.target.src = "/placeholder.svg"
            }}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Track title and artist overlay */}
          <div className="absolute bottom-4 left-4 right-16 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
            <h3 className="font-serif font-bold text-lg mb-1 line-clamp-2">{track.name}</h3>
            <p className="font-sans text-white/90 text-sm">{getPrimaryArtist()}</p>
          </div>
          
          {/* Play/Preview button */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handlePlayPause}
              className={`p-3 rounded-full transition-all duration-200 shadow-lg ${
                track.preview_url && !hasError
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
              title={getPlayButtonTitle()}
              aria-label={getPlayButtonTitle()}
            >
              {getPlayButtonContent()}
            </button>
          </div>
          
          {/* Spotify link button */}
          {track.external_urls?.spotify && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(track.external_urls.spotify, '_blank', 'noopener,noreferrer')
                }}
                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors duration-200 shadow-lg"
                title="Open in Spotify"
                aria-label="Open track in Spotify"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Track type indicator */}
          <div className="absolute top-4 left-4">
            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              <Music className="w-3 h-3 inline mr-1" />
              Track
            </span>
          </div>

          {/* Preview indicator */}
          {track.preview_url && (
            <div className="absolute top-4 left-20">
              <span className="bg-green-500/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                <Volume2 className="w-3 h-3 inline mr-1" />
                Preview
              </span>
            </div>
          )}
        </div>

        {/* Track Information Section */}
        <div className="p-6" onClick={handleTrackClick}>
          {/* Track title and artists */}
          <div className="mb-3">
            <h3 className="font-serif font-bold text-xl mb-1 line-clamp-2 text-gray-900">
              {track.name}
            </h3>
            <p className="font-sans text-gray-600 line-clamp-1" title={getAllArtists()}>
              {getAllArtists()}
            </p>
          </div>

          {/* Album information */}
          {track.album && (
            <div className="mb-3">
              <p className="font-sans text-gray-500 text-sm line-clamp-1" title={track.album.name}>
                From: {track.album.name}
              </p>
            </div>
          )}

          {/* Track metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            {track.duration_ms && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(track.duration_ms)}</span>
              </div>
            )}
            {track.popularity && (
              <div className="flex items-center gap-1">
                <Music className="w-3 h-3" />
                <span>{track.popularity}% popular</span>
              </div>
            )}
          </div>

          {/* Mood indicator */}
          {mood && (
            <p className="font-sans text-sm text-purple-600 font-medium mb-2">
              Great for {mood} vibes
            </p>
          )}

          {/* Track features and availability */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                Track
              </span>
              {track.explicit && (
                <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  Explicit
                </span>
              )}
              {track.preview_url && (
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Preview
                </span>
              )}
            </div>
            
            {track.external_urls?.spotify && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(track.external_urls.spotify, '_blank', 'noopener,noreferrer')
                }}
                className="text-green-600 hover:text-green-700 transition-colors duration-200"
                title="Open in Spotify"
                aria-label="Open track in Spotify"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}