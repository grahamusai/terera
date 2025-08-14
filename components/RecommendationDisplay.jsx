"use client"

import React, { useState } from "react"
import { Music, Disc, Filter, Grid, List } from "lucide-react"
import AlbumCard from "./AlbumCard"
import TrackCard from "./TrackCard"
import { Button } from "@/components/ui/button"

/**
 * RecommendationDisplay Component
 * Displays Spotify recommendations with responsive grid layout and filtering
 */
export default function RecommendationDisplay({ 
  recommendations, 
  mood, 
  isLoading = false,
  onAlbumClick,
  onTrackClick 
}) {
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'albums', 'tracks'
  const [viewMode, setViewMode] = useState('grid') // 'grid', 'list'

  // Extract albums and tracks from recommendations
  const albums = recommendations?.albums || []
  const tracks = recommendations?.tracks || []
  
  // Combine and filter items based on active filter
  const getFilteredItems = () => {
    let items = []
    
    if (activeFilter === 'all' || activeFilter === 'albums') {
      items = [...items, ...albums.map(album => ({ ...album, type: 'album' }))]
    }
    
    if (activeFilter === 'all' || activeFilter === 'tracks') {
      items = [...items, ...tracks.map(track => ({ ...track, type: 'track' }))]
    }
    
    return items
  }

  const filteredItems = getFilteredItems()
  const totalItems = albums.length + tracks.length

  /**
   * Handle filter change
   */
  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
  }

  /**
   * Handle view mode change
   */
  const handleViewModeChange = (mode) => {
    setViewMode(mode)
  }

  /**
   * Get filter button class
   */
  const getFilterButtonClass = (filter) => {
    const baseClass = "px-4 py-2 rounded-lg font-sans font-medium transition-all duration-200"
    const activeClass = "bg-purple-600 text-white shadow-lg"
    const inactiveClass = "bg-white/80 text-gray-700 hover:bg-white hover:shadow-md"
    
    return `${baseClass} ${activeFilter === filter ? activeClass : inactiveClass}`
  }

  /**
   * Get view mode button class
   */
  const getViewModeButtonClass = (mode) => {
    const baseClass = "p-2 rounded-lg transition-all duration-200"
    const activeClass = "bg-purple-600 text-white"
    const inactiveClass = "bg-white/80 text-gray-700 hover:bg-white"
    
    return `${baseClass} ${viewMode === mode ? activeClass : inactiveClass}`
  }

  /**
   * Get grid class based on view mode
   */
  const getGridClass = () => {
    if (viewMode === 'list') {
      return "grid grid-cols-1 md:grid-cols-2 gap-4"
    }
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
  }

  // Don't render if no recommendations
  if (!recommendations || totalItems === 0) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
          Perfect for your mood
        </h2>
        {mood && (
          <p className="text-xl text-white/90 font-sans">
            Curated for when you're feeling <span className="font-semibold">{mood}</span>
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Filter buttons */}
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-xl p-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={getFilterButtonClass('all')}
          >
            <Filter className="w-4 h-4 inline mr-2" />
            All ({totalItems})
          </button>
          <button
            onClick={() => handleFilterChange('albums')}
            className={getFilterButtonClass('albums')}
          >
            <Disc className="w-4 h-4 inline mr-2" />
            Albums ({albums.length})
          </button>
          <button
            onClick={() => handleFilterChange('tracks')}
            className={getFilterButtonClass('tracks')}
          >
            <Music className="w-4 h-4 inline mr-2" />
            Tracks ({tracks.length})
          </button>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-xl p-2">
          <button
            onClick={() => handleViewModeChange('grid')}
            className={getViewModeButtonClass('grid')}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={getViewModeButtonClass('list')}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-center mb-6">
        <p className="text-white/80 font-sans">
          Showing {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
        </p>
      </div>

      {/* Recommendations Grid */}
      <div className={getGridClass()}>
        {filteredItems.map((item, index) => {
          if (item.type === 'album') {
            return (
              <AlbumCard
                key={`album-${item.id}-${index}`}
                album={item}
                mood={mood}
                onAlbumClick={onAlbumClick}
              />
            )
          } else {
            return (
              <TrackCard
                key={`track-${item.id}-${index}`}
                track={item}
                mood={mood}
                onTrackClick={onTrackClick}
              />
            )
          }
        })}
      </div>

      {/* Empty state for filtered results */}
      {filteredItems.length === 0 && (
        <div className="text-center text-white/80 py-12">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-60" />
          <p className="font-sans text-lg">
            No {activeFilter === 'all' ? 'recommendations' : activeFilter} found for this mood.
          </p>
          <p className="font-sans text-sm mt-2">
            Try a different filter or search for another mood.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center text-white/80 py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="w-6 h-6 animate-bounce" />
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
          <p className="font-sans text-lg">Finding your perfect soundtrack...</p>
        </div>
      )}
    </div>
  )
}