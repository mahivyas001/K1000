export type Status = 'open' | 'full' | 'past' | 'cancelled' | 'waitlisted' | 'attended'

const COPY: Record<Status, string> = {
  open: 'Confirmed',
  full: 'Full',
  past: 'Past',
  cancelled: 'Cancelled',
  waitlisted: 'Waitlisted',
  attended: 'Attended',
}

const COLORS: Record<Status, { bg: string; fg: string }> = {
  open: { bg: 'var(--green-bg)', fg: 'var(--green)' },
  full: { bg: 'var(--rust-bg)', fg: 'var(--rust)' },
  past: { bg: 'var(--slate-bg)', fg: 'var(--ink-soft)' },
  cancelled: { bg: 'var(--rust-bg)', fg: 'var(--rust)' },
  waitlisted: { bg: '#fbecd2', fg: 'var(--amber-ink)' },
  attended: { bg: 'var(--slate-bg)', fg: 'var(--ink)' },
}

export default function StatusBadge({ status }: { status: Status | string }) {
  const s = (status in COLORS ? status : 'past') as Status
  const { bg, fg } = COLORS[s]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        padding: '3px 8px',
        borderRadius: '999px',
        background: bg,
        color: fg,
        whiteSpace: 'nowrap',
      }}
    >
      {COPY[s] || status}
    </span>
  )
}
