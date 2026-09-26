import Link from 'next/link'
import { DbEvent } from '@/types/database'
import { isPastEvent, isFullEvent } from '@/data/events'
import StatusBadge from './StatusBadge'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EventCard({ event }: { event: DbEvent }) {
  const past = isPastEvent(event)
  const full = event.is_full || isFullEvent(event)
  const status = event.status === 'cancelled' ? 'cancelled' : past ? 'past' : full ? 'full' : 'open'

  const hoursUntilEvent = (new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60)
  const isHappeningSoon = hoursUntilEvent > 0 && hoursUntilEvent <= 48

  return (
    <Link href={`/events/${event.id}`} className="event-card">
      <div className="event-card__main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="event-card__category">{event.category}</span>
          {isHappeningSoon && (
            <span className="eyebrow-tag" style={{ fontSize: 10, padding: '2px 6px', margin: 0 }}>
              Happening Soon
            </span>
          )}
        </div>
        <h3 className="event-card__name">{event.name}</h3>
        <div className="event-card__meta">
          <span>{formatDate(event.date)}</span>
          <span>·</span>
          <span>{event.venue}</span>
        </div>
      </div>
      <div className="event-card__stub">
        <StatusBadge status={status} />
        <span className="event-card__seats">
          {event.available_seats}/{event.capacity} seats
        </span>
      </div>
    </Link>
  )
}
