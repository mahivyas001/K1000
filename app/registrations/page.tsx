'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { getRegistrationsForStudent } from '@/data/registrations'
import { getEventById, isPastEvent } from '@/data/events'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { DbRegistration, DbEvent } from '@/types/database'

export default function RegistrationsPage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [regs, setRegs] = useState<(DbRegistration & { event: DbEvent | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser.role === 'student') {
      getRegistrationsForStudent(currentUser.id).then(async (data) => {
        const withEvents = await Promise.all(
          data.map(async (r) => ({ ...r, event: await getEventById(r.event_id) }))
        )
        setRegs(withEvents)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [currentUser])

  if (currentUser.role !== 'student') {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState
          title="This page is for students"
          description="Switch to a student account from the top-right menu to see registered events."
        />
      </section>
    )
  }

  if (loading) return null

  const activeRegs = regs.filter(r =>
    r.status !== 'cancelled' &&
    r.event &&
    r.event.status !== 'cancelled'
  )

  const upcoming = activeRegs.filter((r) => !isPastEvent(r.event!))
  const past = activeRegs.filter((r) => isPastEvent(r.event!))

  const handleCancel = async (regId: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return
    setLoadingId(regId)
    await fetch(`/api/registrations/${regId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': currentUser.id }
    })
    setRegs(prev => prev.map(r => r.id === regId ? { ...r, status: 'cancelled' } : r))
    setLoadingId(null)
    router.refresh()
  }

  const renderList = (list: typeof activeRegs, isPastGroup: boolean) => (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {list.map((reg) => (
        <li
          key={reg.id}
          className="card-surface"
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            opacity: isPastGroup ? 0.6 : 1,
            background: isPastGroup ? 'var(--paper)' : 'var(--paper-raised)'
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <Link
              href={`/events/${reg.event!.id}`}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, textDecoration: 'none', color: 'var(--ink)' }}
            >
              {reg.event!.name}
            </Link>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 6 }}>
              {new Date(reg.event!.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {reg.event!.venue}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <StatusBadge status={isPastGroup ? 'past' : (reg.status === 'waitlisted' ? 'waitlisted' : 'open')} />

            <div style={{ display: 'flex', gap: 8 }}>
              <Link
                href={`/events/${reg.event!.id}`}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: 13 }}
              >
                View
              </Link>

              {!isPastGroup && (
                <button
                  className="btn btn-secondary"
                  disabled={loadingId === reg.id}
                  onClick={() => handleCancel(reg.id)}
                  style={{ padding: '6px 12px', fontSize: 13, color: 'var(--rust)', borderColor: 'var(--rust)' }}
                >
                  {loadingId === reg.id ? 'Cancelling...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 32 }}>
        <span className="eyebrow-tag">signed up as {currentUser.name}</span>
        <h1 style={{ fontSize: 30, marginTop: 10 }}>My registrations</h1>
        <p style={{ marginTop: 8, color: 'var(--ink-soft)' }}>
          Manage your upcoming events and view your history.
        </p>
      </div>

      {activeRegs.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="Once you register for an event, it'll show up here."
          action={<Link href="/events" className="btn btn-primary">Browse events</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Upcoming
                <span style={{ fontSize: 12, background: 'var(--green-bg)', color: 'var(--green)', padding: '2px 8px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)' }}>
                  {upcoming.length}
                </span>
              </h2>
              {renderList(upcoming, false)}
            </div>
          )}

          {/* All-caught-up state */}
          {upcoming.length === 0 && past.length > 0 && (
            <div className="card-surface" style={{ padding: 32, textAlign: 'center', background: 'var(--paper)' }}>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>You're all caught up</h3>
              <p style={{ color: 'var(--ink-soft)', marginBottom: 16, fontSize: 14 }}>
                You don't have any upcoming events. Find something new to attend!
              </p>
              <Link href="/events" className="btn btn-primary">Browse events</Link>
            </div>
          )}

          {/* History */}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 16, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                History
                <span style={{ fontSize: 12, background: 'var(--slate-bg)', color: 'var(--ink-soft)', padding: '2px 8px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)' }}>
                  {past.length}
                </span>
              </h2>
              {renderList(past, true)}
            </div>
          )}

        </div>
      )}
    </section>
  )
}
