'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getEvents, isPastEvent, EventCategory } from '@/data/events'
import EventCard from '@/components/EventCard'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/components/AuthProvider'
import { DbEvent } from '@/types/database'

const QUICK_CATEGORIES: EventCategory[] = ['Tech', 'Music', 'Sports', 'Career']

export default function HomePage() {
  const { currentUser } = useAuth()
  const [events, setEvents] = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEvents().then(data => {
      setEvents(data)
      setLoading(false)
    })
  }, [])

  if (loading) return null

  const upcoming = events
    .filter((e) => !isPastEvent(e) && e.status !== 'cancelled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  const venueCount = new Set(events.map((e) => e.venue)).size
  const upcomingCount = events.filter((e) => !isPastEvent(e) && e.status !== 'cancelled').length

  return (
    <>
      <section className="shell" style={{ padding: '56px 0 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 40, alignItems: 'end' }} className="hero-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="eyebrow-tag">
              {currentUser.role === 'student' ? `Welcome back, ${currentUser.name.split(' ')[0]}` : 'Organizer Console'}
            </span>
            <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
              Every club, match, and workshop on campus — in one place.
            </h1>
            <p style={{ fontSize: 16.5 }}>
              No more scattered WhatsApp forwards. Discover what's happening today.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <Link href="/events" className="btn btn-primary">Browse all events</Link>
              {currentUser.role === 'organizer' && (
                <Link href="/organizer" className="btn btn-secondary">Manage my events</Link>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {QUICK_CATEGORIES.map(cat => (
                <Link
                  key={cat}
                  href={`/events?category=${cat}`}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius)',
                    border: '1.5px solid var(--line)',
                    textDecoration: 'none',
                    color: 'var(--ink-soft)',
                    background: 'var(--paper-raised)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ink)'
                    e.currentTarget.style.color = 'var(--ink)'
                    e.currentTarget.style.boxShadow = '2px 2px 0 var(--ink)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--line)'
                    e.currentTarget.style.color = 'var(--ink-soft)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          <div className="card-surface" style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Stat label="Upcoming events" value={String(upcomingCount)} />
            <Stat label="Campus venues" value={String(venueCount)} />
            <Stat label="Categories" value="6" />
            <Stat label="Total seats posted" value={String(events.reduce((s, e) => s + e.capacity, 0))} />
          </div>
        </div>
      </section>

      <section className="shell" style={{ padding: '24px 0 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <h2 style={{ fontSize: 22 }}>Coming up soon</h2>
          <Link href="/events" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            See full listing →
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming events" description="Check back later or browse past events." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{label}</div>
    </div>
  )
}
