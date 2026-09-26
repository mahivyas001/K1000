'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getEventById, isPastEvent, isFullEvent } from '@/data/events'
import { getUserRegistrationForEvent } from '@/data/registrations'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/components/AuthProvider'
import { DbEvent } from '@/types/database'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [event, setEvent] = useState<DbEvent | null>(null)
  const [userReg, setUserReg] = useState<{ id: string, status: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [regLoading, setRegLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getEventById(params.id).then(data => {
      setEvent(data)
      setLoading(false)
    })
  }, [params.id])

  useEffect(() => {
    if (currentUser.role === 'student' && event) {
      getUserRegistrationForEvent(currentUser.id, event.id).then(setUserReg)
    }
  }, [currentUser, event])

  const refreshStatus = async () => {
    if (currentUser.role === 'student' && event) {
      const reg = await getUserRegistrationForEvent(currentUser.id, event.id)
      setUserReg(reg)
      const updated = await getEventById(event.id)
      setEvent(updated)
    }
  }

  const handleAction = async () => {
    setRegLoading(true); setFeedback(null)
    try {
      if (userReg) {
        const res = await fetch(`/api/registrations/${userReg.id}`, {
          method: 'DELETE',
          headers: { 'x-user-id': currentUser.id }
        })
        if (!res.ok) throw new Error('Failed to cancel')
        setFeedback({ type: 'success', msg: userReg.status === 'confirmed' ? 'Registration cancelled. Seat freed up!' : 'Removed from waitlist.' })
      } else {
        const res = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
          body: JSON.stringify({ eventId: event?.id })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setFeedback({ type: 'success', msg: data.message })
      }
      await refreshStatus()
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message })
    } finally {
      setRegLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return null

  if (!event) {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState
          title="This event isn't on the board"
          description="It may have been removed, or the link might be wrong."
          action={<Link href="/events" className="btn btn-primary">Back to events</Link>}
        />
      </section>
    )
  }

  const past = isPastEvent(event)
  const full = event.is_full || isFullEvent(event)
  const status = event.status === 'cancelled' ? 'cancelled' : past ? 'past' : full ? 'full' : 'open'
  const isRegistered = userReg?.status === 'confirmed'
  const isWaitlisted = userReg?.status === 'waitlisted'
  const canInteract = !past && event.status !== 'cancelled' && currentUser.role === 'student'

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      {/* Smart Back Button — falls back to /events if no history */}
      <Link
        href="/events"
        onClick={(e) => {
          if (window.history.length > 2) {
            e.preventDefault()
            router.back()
          }
        }}
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          textDecoration: 'none',
          marginBottom: 24,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        ← Back to events
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48, alignItems: 'start', marginTop: 24 }} className="hero-grid">
        {/* Left: Event Details */}
        <div>
          <span className="eyebrow-tag">{event.category}</span>
          <h1 style={{ fontSize: 36, marginTop: 16, lineHeight: 1.1 }}>{event.name}</h1>
          <div style={{ marginTop: 24, fontSize: 15.5, color: 'var(--ink-soft)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {event.description || 'No description provided.'}
          </div>
        </div>

        {/* Right: Sticky Registration Card */}
        <aside
          className="card-surface"
          style={{
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            position: 'sticky',
            top: 100
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <StatusBadge status={status} />
            <button
              onClick={copyLink}
              style={{ fontSize: 12, color: 'var(--ink-soft)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {copied ? 'Copied!' : 'Share link'}
            </button>
          </div>

          {/* Event Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Detail label="Date & Time" value={`${formatDate(event.date)} at ${formatTime(event.date)}`} />
            <Detail label="Venue" value={event.venue} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4 }}>Availability</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                {event.available_seats} of {event.capacity} seats available
                {event.available_seats > 0 && event.available_seats <= 10 && (
                  <span style={{ fontSize: 11, color: 'var(--rust)', fontWeight: 700 }}>Almost full!</span>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1.5px solid var(--line)' }} />

          {/* Feedback */}
          {feedback && (
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius)',
              background: feedback.type === 'success' ? 'var(--green-bg)' : 'var(--rust-bg)',
              color: feedback.type === 'success' ? 'var(--green)' : 'var(--rust)',
              fontSize: 13,
              fontWeight: 500
            }}>
              {feedback.msg}
            </div>
          )}

          {/* Action Button */}
          {(() => {
            const base: React.CSSProperties = { width: '100%' }

            if (currentUser.role === 'organizer') {
              return (
                <button className="btn btn-secondary" disabled style={{ ...base, opacity: 0.6 }}>
                  Organizers cannot register
                </button>
              )
            }
            if (!canInteract) {
              return (
                <button className="btn btn-secondary" disabled style={base}>
                  {past ? 'Event has passed' : event.status === 'cancelled' ? 'Event cancelled' : 'Registration closed'}
                </button>
              )
            }
            if (isRegistered) {
              return (
                <button className="btn btn-secondary" disabled={regLoading} onClick={handleAction} style={{ ...base, color: 'var(--rust)', borderColor: 'var(--rust)' }}>
                  {regLoading ? 'Processing...' : 'Cancel Registration'}
                </button>
              )
            }
            if (isWaitlisted) {
              return (
                <button className="btn btn-secondary" disabled={regLoading} onClick={handleAction} style={{ ...base, color: 'var(--amber-ink)', borderColor: 'var(--amber-ink)' }}>
                  {regLoading ? 'Processing...' : 'Leave Waitlist'}
                </button>
              )
            }
            if (full) {
              return (
                <button className="btn btn-primary" disabled={regLoading} onClick={handleAction} style={base}>
                  {regLoading ? 'Processing...' : 'Join Waitlist'}
                </button>
              )
            }
            return (
              <button className="btn btn-primary" disabled={regLoading} onClick={handleAction} style={base}>
                {regLoading ? 'Processing...' : 'Register'}
              </button>
            )
          })()}
        </aside>
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14.5, fontWeight: 500 }}>{value}</div>
    </div>
  )
}
