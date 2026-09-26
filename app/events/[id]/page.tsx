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

function formatDate(iso: string) { return new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
function formatTime(iso: string) { return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) }

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [event, setEvent] = useState<DbEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [regLoading, setRegLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const [userReg, setUserReg] = useState<{ id: string, status: string } | null>(null)

  useEffect(() => {
    getEventById(params.id).then(data => { setEvent(data); setLoading(false) })
  }, [params.id])

  useEffect(() => {
    if (currentUser.role === 'student' && event) {
      getUserRegistrationForEvent(currentUser.id, event.id).then(setUserReg)
    }
  }, [currentUser, event])

  if (loading) return <section className="shell" style={{ padding: '56px 0' }}>Loading...</section>
  if (!event) return <section className="shell" style={{ padding: '56px 0' }}><EmptyState title="This event isn't on the board" description="It may have been removed." action={<Link href="/events" className="btn btn-primary">Back to events</Link>} /></section>

  const past = isPastEvent(event)
  const full = isFullEvent(event)
  const status = event.status === 'cancelled' ? 'cancelled' : past ? 'past' : full ? 'full' : 'open'
  const eventClosed = past || event.status === 'cancelled'

  const refreshStatus = async () => {
    const [updatedEvent, updatedReg] = await Promise.all([
      getEventById(event.id),
      currentUser.role === 'student' ? getUserRegistrationForEvent(currentUser.id, event.id) : Promise.resolve(null)
    ])
    setEvent(updatedEvent)
    setUserReg(updatedReg)
  }

  const handleAction = async (action: 'register' | 'cancel') => {
    setRegLoading(true); setFeedback(null)
    try {
      if (action === 'register') {
        const res = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
          body: JSON.stringify({ eventId: event.id })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const msg = data.status === 'waitlisted'
          ? 'You are on the waitlist. We\'ll notify you if a seat opens up!'
          : 'Successfully registered!'
        setFeedback({ type: 'success', msg })
      } else {
        // cancel
        if (!userReg) return
        const res = await fetch(`/api/registrations/${userReg.id}`, {
          method: 'DELETE',
          headers: { 'x-user-id': currentUser.id }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setFeedback({ type: 'success', msg: 'Registration cancelled.' })
      }
      await refreshStatus()
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message })
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <Link href="/events" style={{ fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>← All events</Link>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32, marginTop: 20 }} className="hero-grid">
        <div>
          <span className="eyebrow-tag">{event.category}</span>
          <h1 style={{ fontSize: 32, marginTop: 12 }}>{event.name}</h1>
          <p style={{ marginTop: 16, fontSize: 15.5 }}>{event.description}</p>
        </div>
        <aside className="card-surface" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, height: 'fit-content' }}>
          <StatusBadge status={status} />
          <Detail label="Date" value={formatDate(event.date)} />
          <Detail label="Time" value={formatTime(event.date)} />
          <Detail label="Venue" value={event.venue} />
          <Detail label="Seats" value={`${event.available_seats} of ${event.capacity} available`} />
          {feedback && <div style={{ padding: '10px', borderRadius: 'var(--radius)', background: feedback.type === 'success' ? 'var(--green-bg)' : 'var(--rust-bg)', color: feedback.type === 'success' ? 'var(--green)' : 'var(--rust)', fontSize: 14 }}>{feedback.msg}</div>}

          {currentUser.role === 'organizer' ? (
            <button className="btn btn-secondary" disabled style={{ marginTop: 4, opacity: 0.6 }}>
              Organizers cannot register
            </button>
          ) : eventClosed ? (
            <button className="btn btn-primary" disabled style={{ marginTop: 4 }}>Registration closed</button>
          ) : userReg && userReg.status === 'confirmed' ? (
            <button className="btn btn-danger" disabled={regLoading} onClick={() => handleAction('cancel')} style={{ marginTop: 4 }}>
              {regLoading ? 'Processing...' : 'Cancel Registration'}
            </button>
          ) : userReg && userReg.status === 'waitlisted' ? (
            <button className="btn btn-secondary" disabled={regLoading} onClick={() => handleAction('cancel')} style={{ marginTop: 4 }}>
              {regLoading ? 'Processing...' : 'Leave Waitlist'}
            </button>
          ) : full ? (
            <button className="btn btn-secondary" disabled={regLoading} onClick={() => handleAction('register')} style={{ marginTop: 4 }}>
              {regLoading ? 'Processing...' : 'Join Waitlist'}
            </button>
          ) : (
            <button className="btn btn-primary" disabled={regLoading} onClick={() => handleAction('register')} style={{ marginTop: 4 }}>
              {regLoading ? 'Processing...' : 'Register'}
            </button>
          )}
        </aside>
      </div>
    </section>
  )
}
function Detail({ label, value }: { label: string; value: string }) { return <div><div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{label}</div><div style={{ fontSize: 14.5, fontWeight: 500 }}>{value}</div></div> }
