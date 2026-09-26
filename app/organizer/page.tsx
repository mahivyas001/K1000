'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { getEventsByOrganizer, EventCategory } from '@/data/events'
import EmptyState from '@/components/EmptyState'
import StatusBadge from '@/components/StatusBadge'
import { DbEvent } from '@/types/database'

const CATEGORIES: EventCategory[] = ['Tech', 'Cultural', 'Sports', 'Workshop', 'Career', 'Music', 'Other']

export default function OrganizerPage() {
  const router = useRouter()
  const { currentUser } = useAuth()

  const [events, setEvents] = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<DbEvent | null>(null)
  const [formError, setFormError] = useState('')

  // Attendees State
  const [attendees, setAttendees] = useState<any[]>([])
  const [showAttendeesId, setShowAttendeesId] = useState<string | null>(null)
  const [loadingAttendees, setLoadingAttendees] = useState(false)

  useEffect(() => {
    if (currentUser.role === 'organizer') {
      getEventsByOrganizer(currentUser.id).then(data => {
        setEvents(data)
        setLoading(false)
      })
    }
  }, [currentUser])

  if (currentUser.role !== 'organizer') {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState title="This page is for organizers" description="Switch to an organizer account from the top-right menu to manage events." />
      </section>
    )
  }

  if (loading) return null

  const totalEvents = events.length
  const totalRegistrations = events.reduce((sum, e) => sum + (e.confirmed_count ?? 0), 0)

  const openCreateModal = () => {
    setEditingEvent(null)
    setFormError('')
    setShowForm(true)
  }

  const openEditModal = (event: DbEvent) => {
    setEditingEvent(event)
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError('')
    const formData = new FormData(e.currentTarget)
    const payload = {
      name: formData.get('name'),
      date: formData.get('date'),
      venue: formData.get('venue'),
      capacity: formData.get('capacity'),
      category: formData.get('category'),
      description: formData.get('description'),
      organizerId: currentUser.id
    }

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events'
      const method = editingEvent ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowForm(false)
      getEventsByOrganizer(currentUser.id).then(setEvents)
      router.refresh()
    } catch (err: any) {
      setFormError(err.message)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this event? It will be hidden from students but kept in your history.')) return
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': currentUser.id }
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error)
      return
    }
    getEventsByOrganizer(currentUser.id).then(setEvents)
  }

  const handleHardDelete = async (id: string) => {
    if (!confirm('PERMANENTLY delete this event? This cannot be undone.')) return
    const res = await fetch(`/api/events/${id}?action=hard`, {
      method: 'DELETE',
      headers: { 'x-user-id': currentUser.id }
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error)
      return
    }
    getEventsByOrganizer(currentUser.id).then(setEvents)
  }

  const toggleAttendees = async (eventId: string) => {
    if (showAttendeesId === eventId) {
      setShowAttendeesId(null)
      return
    }
    setLoadingAttendees(true)
    setShowAttendeesId(eventId)
    const res = await fetch(`/api/events/${eventId}/registrations`, {
      headers: { 'x-user-id': currentUser.id }
    })
    const data = await res.json()
    setAttendees(data.attendees || [])
    setLoadingAttendees(false)
  }

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow-tag">organizer console</span>
          <h1 style={{ fontSize: 30, marginTop: 10 }}>Manage your events</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ New event</button>
      </div>

      {/* Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Events</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>{totalEvents}</div>
        </div>
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Registrations</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>{totalRegistrations}</div>
        </div>
      </div>

      {/* Event List */}
      {events.length === 0 ? (
        <EmptyState
          title="No events posted yet"
          description="Create your first event to start accepting registrations."
          action={<button className="btn btn-primary" onClick={openCreateModal}>Create Event</button>}
        />
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {events.map((event) => {
            const isPast = new Date(event.date).getTime() < Date.now()
            const status = event.status === 'cancelled' ? 'cancelled' : isPast ? 'past' : event.is_full ? 'full' : 'open'

            return (
              <li key={event.id} className="card-surface" style={{ overflow: 'hidden' }}>
                {/* Main Row */}
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <Link href={`/events/${event.id}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, textDecoration: 'none', color: 'var(--ink)' }}>
                        {event.name}
                      </Link>
                      <StatusBadge status={status} />
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>·</span>
                      <span>{event.venue}</span>
                      <span>·</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{event.confirmed_count}/{event.capacity} seats</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 13 }}
                      onClick={() => toggleAttendees(event.id)}
                    >
                      {showAttendeesId === event.id ? 'Hide' : 'Attendees'}
                    </button>

                    {/* Edit: locked for past/cancelled events */}
                    {event.status !== 'cancelled' && !isPast && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 13 }}
                        onClick={() => openEditModal(event)}
                      >
                        Edit
                      </button>
                    )}

                    {event.status !== 'cancelled' && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 13, color: 'var(--amber-ink)', borderColor: 'var(--amber-ink)' }}
                        onClick={() => handleCancel(event.id)}
                      >
                        Cancel
                      </button>
                    )}

                    {event.confirmed_count === 0 && event.waitlisted_count === 0 && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 13, color: 'var(--rust)', borderColor: 'var(--rust)' }}
                        onClick={() => handleHardDelete(event.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Attendees Drawer */}
                {showAttendeesId === event.id && (
                  <div style={{ padding: '16px 24px', borderTop: '1.5px solid var(--line)', background: 'var(--paper)' }}>
                    <h4 style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Registered Students ({attendees.filter(a => a.status === 'confirmed').length})
                      {attendees.filter(a => a.status === 'waitlisted').length > 0 && (
                        <span style={{ marginLeft: 8, color: 'var(--amber-ink)' }}>
                          · {attendees.filter(a => a.status === 'waitlisted').length} waitlisted
                        </span>
                      )}
                    </h4>
                    {loadingAttendees ? (
                      <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Loading...</p>
                    ) : attendees.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No registrations yet.</p>
                    ) : (
                      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8 }}>
                        {attendees.map(a => (
                          <li key={a.id} className="card-surface" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper-raised)' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{a.users?.name || 'Unknown'}</div>
                              <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{a.users?.email || ''}</div>
                            </div>
                            <StatusBadge status={a.status === 'confirmed' ? 'open' : a.status === 'waitlisted' ? 'waitlisted' : 'cancelled'} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(33, 31, 28, 0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
        >
          <div className="card-surface" style={{ width: '100%', maxWidth: 600, padding: 32, background: 'var(--paper-raised)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22 }}>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--ink-soft)', lineHeight: 1 }}>×</button>
            </div>

            {formError && (
              <div style={{ padding: 12, marginBottom: 16, background: 'var(--rust-bg)', color: 'var(--rust)', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>Event Name</label>
                <input name="name" defaultValue={editingEvent?.name} required style={{ width: '100%', padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--paper)', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>Date & Time</label>
                <input
                  name="date"
                  type="datetime-local"
                  defaultValue={editingEvent?.date
                    ? new Date(new Date(editingEvent.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                    : ''}
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  required
                  style={{ width: '100%', padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--paper)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>Venue</label>
                <input name="venue" defaultValue={editingEvent?.venue} required style={{ width: '100%', padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--paper)', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>Capacity</label>
                <input name="capacity" type="number" defaultValue={editingEvent?.capacity} required min="1" max="10000" style={{ width: '100%', padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--paper)', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>Category</label>
                <select name="category" defaultValue={editingEvent?.category || 'Tech'} style={{ width: '100%', padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--paper)', boxSizing: 'border-box' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>Description</label>
                <textarea name="description" defaultValue={editingEvent?.description || ''} rows={4} style={{ width: '100%', padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--paper)', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingEvent ? 'Save Changes' : 'Create Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
