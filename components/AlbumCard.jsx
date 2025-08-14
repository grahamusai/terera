"use client"

import React from "react"
import { Music, ExternalLink, Calendar, Disc } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

/**
 * AlbumCard Component
 * Displays Spotify album data with artwork, metadata, and interaction handlers
 */
export default function AlbumCard({ album, mood, onAlbumClick }) {
  /**
   * Handle album click - opens Spotify link or triggers custom handler
   */
  const handleAlbumClick = () => {
    if (onAlbumClick) {
      onAlbumClick(album)
    } else if (album.external_urls?.spotify) {
      window.open(album.external_urls.spotify, '_blank', 'noopener,noreferrer')
    }
  }

  /**
   * Format release date for display
   */
  const formatReleaseDate = (dateString) => {
    if (!dateString) return 'Unknown'
    
    try {
      const date = new Date(dateString)
      return date.getFullYear().toString()
    } catch {
      return dateString
    }
  }

  /**
   * Get album artwork URL with fallback
   */
  const getAlbumArtwork = () => {
    if (album.images && album.images.length > 0) {
      // Use medium size image (usually index 1) or largest available
      return album.images[1]?.url || album.images[0]?.url
    }
    return "/placeholder.svg"
  }

  /**
   * Get primary artist name
   */
  const getPrimaryArtist = () => {
    if (album.artists && album.artists.length > 0) {
      return album.artists[0].name
    }
    return 'Unknown Artist'
  }

  /**
   * Get all artist names formatted
   */
  const getAllArtists = () => {
    if (album.artists && album.artists.length > 0) {
      return album.artists.map(artist => artist.name).join(', ')
    }
    return 'Unknown Artist'
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group">
      <CardContent className="p-0">
        {/* Album Artwork Section */}
        <div className="aspect-square relative overflow-hidden">
          <img
            src={getAlbumArtwork()}
            alt={`${album.name} album cover`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              e.target.src = "/placeholder.svg"
            }}
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Album title and artist overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
            <h3 className="font-serif font-bold text-lg mb-1 line-clamp-2">{album.name}</h3>
            <p className="font-sans text-white/90 text-sm">{getPrimaryArtist()}</p>
          </div>
          
          {/* Spotify link button */}
          {album.external_urls?.spotify && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(album.external_urls.spotify, '_blank', 'noopener,noreferrer')
                }}
                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors duration-200 shadow-lg"
                title="Open in Spotify"
                aria-label="Open album in Spotify"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Album type indicator */}
          <div className="absolute top-4 left-4">
            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              <Disc className="w-3 h-3 inline mr-1" />
              Album
            </span>
          </div>
        </div>

        {/* Album Information Section */}
        <div className="p-6" onClick={handleAlbumClick}>
          {/* Album title and artists */}
          <div className="mb-3">
            <h3 className="font-serif font-bold text-xl mb-1 line-clamp-2 text-gray-900">
              {album.name}
            </h3>
            <p className="font-sans text-gray-600 line-clamp-1" title={getAllArtists()}>
              {getAllArtists()}
            </p>
          </div>

          {/* Album metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            {album.release_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatReleaseDate(album.release_date)}</span>
              </div>
            )}
            {album.total_tracks && (
              <div className="flex items-center gap-1">
                <Music className="w-3 h-3" />
                <span>{album.total_tracks} tracks</span>
              </div>
            )}
          </div>

          {/* Mood indicator */}
          {mood && (
            <p className="font-sans text-sm text-purple-600 font-medium mb-2">
              Perfect for {mood} mood
            </p>
          )}

          {/* Album type and availability */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                {album.album_type || 'Album'}
              </span>
              {album.available_markets && album.available_markets.length > 0 && (
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Available
                </span>
              )}
            </div>
            
            {album.external_urls?.spotify && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(album.external_urls.spotify, '_blank', 'noopener,noreferrer')
                }}
                className="text-green-600 hover:text-green-700 transition-colors duration-200"
                title="Open in Spotify"
                aria-label="Open album in Spotify"
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