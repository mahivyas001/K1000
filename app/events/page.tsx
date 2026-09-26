'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { getEvents, searchEventsByName, filterEventsByCategory, isPastEvent, EventCategory } from '@/data/events'
import EventCard from '@/components/EventCard'
import EmptyState from '@/components/EmptyState'
import { DbEvent } from '@/types/database'

const CATEGORIES: (EventCategory | 'All')[] = ['All', 'Tech', 'Cultural', 'Sports', 'Workshop', 'Career', 'Music']

export default function EventsPage() {
  const searchParams = useSearchParams()
  const initialCategory = (searchParams.get('category') as EventCategory) || 'All'

  const [events, setEvents] = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<EventCategory | 'All'>(initialCategory)
  const [sortBy, setSortBy] = useState<'date' | 'popularity'>('date')

  useEffect(() => {
    getEvents().then(data => {
      setEvents(data)
      setLoading(false)
    })
  }, [])

  const filteredEvents = useMemo(() => {
    let result = events.filter((e) => !isPastEvent(e) && e.status !== 'cancelled')
    result = searchEventsByName(result, query)
    result = filterEventsByCategory(result, category)

    if (sortBy === 'date') {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (sortBy === 'popularity') {
      result.sort((a, b) => (b.confirmed_count ?? 0) - (a.confirmed_count ?? 0))
    }

    return result
  }, [events, query, category, sortBy])

  const hasActiveFilters = query.trim() !== '' || category !== 'All'

  const clearFilters = () => {
    setQuery('')
    setCategory('All')
  }

  if (loading) return null

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <span className="eyebrow-tag">the board</span>
        <h1 style={{ fontSize: 30, marginTop: 10 }}>All events</h1>
        <p style={{ marginTop: 8, color: 'var(--ink-soft)' }}>
          Everything posted by clubs and departments this semester.
        </p>
      </div>

      {/* Elevated Toolbar */}
      <div className="card-surface" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', background: 'var(--paper-raised)' }}>
        <input
          type="search"
          placeholder="Search by name, venue, or description…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: '2 1 240px',
            padding: '10px 14px',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14.5,
            background: 'var(--paper)',
            outline: 'none'
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory | 'All')}
          style={{
            flex: '1 1 150px',
            padding: '10px 14px',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14.5,
            background: 'var(--paper)',
            color: 'var(--ink)',
            cursor: 'pointer'
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'popularity')}
          style={{
            flex: '1 1 150px',
            padding: '10px 14px',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14.5,
            background: 'var(--paper)',
            color: 'var(--ink)',
            cursor: 'pointer'
          }}
        >
          <option value="date">Sort: Date (Soonest)</option>
          <option value="popularity">Sort: Popularity</option>
        </select>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>Active:</span>

          {category !== 'All' && (
            <span
              className="eyebrow-tag"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setCategory('All')}
            >
              {category} <span style={{ opacity: 0.6 }}>×</span>
            </span>
          )}

          {query.trim() && (
            <span
              className="eyebrow-tag"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setQuery('')}
            >
              "{query}" <span style={{ opacity: 0.6 }}>×</span>
            </span>
          )}

          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: 12, height: 'auto' }}
            onClick={clearFilters}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Result Count & Grid */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try adjusting your search or filters to find what you're looking for."
          action={
            hasActiveFilters ? (
              <button className="btn btn-primary" onClick={clearFilters}>
                Clear all filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
              Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
