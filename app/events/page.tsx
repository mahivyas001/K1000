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
  const [events, setEvents] = useState<DbEvent[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<EventCategory | 'All'>(
    (searchParams.get('category') as EventCategory) || 'All'
  )
  const [sortBy, setSortBy] = useState<'date' | 'popularity'>('date')

  useEffect(() => { getEvents().then(setEvents) }, [])

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

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow-tag">the board</span>
        <h1 style={{ fontSize: 30, marginTop: 10 }}>All events</h1>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <input type="search" placeholder="Search by name, venue or description…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: '1 1 240px', padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', fontSize: 14.5, background: 'var(--paper-raised)' }} />
        <select value={category} onChange={(e) => setCategory(e.target.value as EventCategory | 'All')} style={{ padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', fontSize: 14.5, background: 'var(--paper-raised)' }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'popularity')} style={{ padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', fontSize: 14.5, background: 'var(--paper-raised)' }}>
          <option value="date">Sort: Date (Soonest)</option>
          <option value="popularity">Sort: Popularity</option>
        </select>
      </div>
      {filteredEvents.length === 0 ? <EmptyState title="No events found" description="Try adjusting your search." /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredEvents.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </section>
  )
}
