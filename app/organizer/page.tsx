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
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<DbEvent | null>(null)
  const [formError, setFormError] = useState('')
  const [attendees, setAttendees] = useState<any[]>([])
  const [showAttendeesId, setShowAttendeesId] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser.role === 'organizer') getEventsByOrganizer(currentUser.id).then(setEvents)
  }, [currentUser])

  if (currentUser.role !== 'organizer') return <section className="shell" style={{ padding: '56px 0' }}><EmptyState title="This page is for organizers" description="Switch to an organizer account." /></section>

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setFormError('')
    const formData = new FormData(e.currentTarget)
    const payload = { name: formData.get('name'), date: formData.get('date'), venue: formData.get('venue'), capacity: formData.get('capacity'), category: formData.get('category'), description: formData.get('description'), organizerId: currentUser.id }
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events'
      const method = editingEvent ? 'PATCH' : 'POST'
      const res = await fetch(url, { 
        method, 
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        }, 
        body: JSON.stringify(payload) 
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowForm(false); setEditingEvent(null); router.refresh()
      getEventsByOrganizer(currentUser.id).then(setEvents)
    } catch (err: any) { setFormError(err.message) }
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

  const loadAttendees = async (eventId: string) => {
    if (showAttendeesId === eventId) { setShowAttendeesId(null); return }
    const res = await fetch(`/api/events/${eventId}/registrations`, {
      headers: { 'x-user-id': currentUser.id }
    })
    const data = await res.json()
    setAttendees(data.attendees || [])
    setShowAttendeesId(eventId)
  }

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div><span className="eyebrow-tag">organizer console</span><h1 style={{ fontSize: 30, marginTop: 10 }}>Manage your events</h1></div>
        <button className="btn btn-primary" onClick={() => { setEditingEvent(null); setShowForm(true) }}>+ New event</button>
      </div>

      {showForm && (
        <div className="card-surface" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
          {formError && <div style={{ color: 'var(--rust)', marginBottom: 12, fontSize: 14 }}>{formError}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <input name="name" defaultValue={editingEvent?.name} placeholder="Event Name" required style={{ padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)' }} />
            <input name="date" type="datetime-local" defaultValue={editingEvent?.date.slice(0, 16)} required style={{ padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)' }} />
            <input name="venue" defaultValue={editingEvent?.venue} placeholder="Venue" required style={{ padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)' }} />
            <input name="capacity" type="number" defaultValue={editingEvent?.capacity} placeholder="Capacity" required min="1" style={{ padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)' }} />
            <select name="category" defaultValue={editingEvent?.category} style={{ padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)' }}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button type="submit" className="btn btn-primary">{editingEvent ? 'Save Changes' : 'Create Event'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
            <textarea name="description" defaultValue={editingEvent?.description || ''} placeholder="Description" style={{ gridColumn: '1 / -1', padding: 10, border: '1.5px solid var(--line)', borderRadius: 'var(--radius)', minHeight: 80 }} />
          </form>
        </div>
      )}

      {events.length === 0 ? <EmptyState title="No events posted yet" description="Once you create an event, it'll show up here." /> : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map((event) => (
            <li key={event.id}>
              <div className="card-surface" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <Link href={`/events/${event.id}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, textDecoration: 'none' }}>{event.name}</Link>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                    {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {event.venue} · {event.available_seats}/{event.capacity} seats
                    {(event.confirmed_count > 0 || event.waitlisted_count > 0) && (
                      <span style={{ marginLeft: 8 }}>· <strong>{event.confirmed_count}</strong> confirmed{event.waitlisted_count > 0 ? `, ${event.waitlisted_count} waitlisted` : ''}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatusBadge status={event.status === 'cancelled' ? 'cancelled' : event.is_full ? 'full' : 'open'} />

                  <button className="btn btn-secondary" onClick={() => loadAttendees(event.id)}>
                    {showAttendeesId === event.id ? 'Hide Attendees' : 'View Attendees'}
                  </button>

                  {event.status !== 'cancelled' && (
                    <>
                      <button className="btn btn-secondary" onClick={() => { setEditingEvent(event); setShowForm(true) }}>
                        Edit
                      </button>
                      <button className="btn btn-secondary" style={{ color: 'var(--amber-ink)' }} onClick={() => handleCancel(event.id)}>
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Hard Delete: Only show if event has 0 registrations */}
                  {event.confirmed_count === 0 && event.waitlisted_count === 0 && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ color: 'var(--rust)', borderColor: 'var(--rust)' }} 
                      onClick={() => handleHardDelete(event.id)}
                      title="Permanently delete event"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {showAttendeesId === event.id && (
                <div className="card-surface" style={{ padding: 16, marginTop: 4, borderTop: '2px solid var(--line)', borderRadius: '0 0 var(--radius) var(--radius)' }}>
                  <h4 style={{ fontSize: 14, marginBottom: 10 }}>
                    Attendees — {attendees.filter(a => a.status === 'confirmed').length} confirmed
                    {attendees.filter(a => a.status === 'waitlisted').length > 0 && `, ${attendees.filter(a => a.status === 'waitlisted').length} waitlisted`}
                  </h4>
                  {attendees.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No registrations yet.</p>
                  ) : (
                    <ul style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {attendees.map(a => (
                        <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 500 }}>{a.users?.name || 'Unknown'}</span>
                            <span style={{ color: 'var(--ink-soft)', marginLeft: 8 }}>{a.users?.email || ''}</span>
                          </div>
                          <StatusBadge status={a.status === 'confirmed' ? 'open' : a.status === 'waitlisted' ? 'waitlisted' : 'cancelled'} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
