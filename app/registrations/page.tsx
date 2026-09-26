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
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser.role === 'student') {
      getRegistrationsForStudent(currentUser.id).then(async (data) => {
        const withEvents = await Promise.all(data.map(async (r) => ({ ...r, event: await getEventById(r.event_id) })))
        setRegs(withEvents)
      })
    }
  }, [currentUser])

  if (currentUser.role !== 'student') return <section className="shell" style={{ padding: '56px 0' }}><EmptyState title="This page is for students" description="Switch to a student account." /></section>

  // Filter out cancelled registrations and cancelled events
  const activeRegs = regs.filter(r => r.status !== 'cancelled' && r.event && r.event.status !== 'cancelled')
  const upcoming = activeRegs.filter((r) => !isPastEvent(r.event!))
  const past = activeRegs.filter((r) => isPastEvent(r.event!))

  const handleCancel = async (regId: string) => {
    setLoadingId(regId)
    await fetch(`/api/registrations/${regId}`, { method: 'DELETE' })
    router.refresh()
    setRegs(prev => prev.map(r => r.id === regId ? { ...r, status: 'cancelled' } : r))
    setLoadingId(null)
  }

  const renderList = (list: typeof activeRegs, isPastGroup: boolean) => (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {list.map((reg) => (
        <li key={reg.id} className="card-surface" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Link href={`/events/${reg.event!.id}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, textDecoration: 'none' }}>{reg.event!.name}</Link>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 4 }}>{new Date(reg.event!.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {reg.event!.venue}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusBadge status={isPastGroup ? 'past' : (reg.status === 'waitlisted' ? 'waitlisted' : 'open')} />
            {!isPastGroup && <button className="btn btn-secondary" disabled={loadingId === reg.id} onClick={() => handleCancel(reg.id)}>{loadingId === reg.id ? 'Cancelling...' : 'Cancel'}</button>}
          </div>
        </li>
      ))}
    </ul>
  )

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28 }}><span className="eyebrow-tag">signed up as {currentUser.name}</span><h1 style={{ fontSize: 30, marginTop: 10 }}>My registrations</h1></div>
      {activeRegs.length === 0 ? <EmptyState title="No registrations yet" description="Once you register for an event, it'll show up here." action={<Link href="/events" className="btn btn-primary">Browse events</Link>} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {upcoming.length > 0 && <div><h2 style={{ fontSize: 20, marginBottom: 16 }}>Upcoming</h2>{renderList(upcoming, false)}</div>}
          {past.length > 0 && <div><h2 style={{ fontSize: 20, marginBottom: 16, color: 'var(--ink-soft)' }}>Past</h2>{renderList(past, true)}</div>}
        </div>
      )}
    </section>
  )
}
