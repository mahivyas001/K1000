export interface DbEvent {
  id: string
  organization_id: string | null
  organizer_id: string | null
  name: string
  description: string | null
  date: string
  venue: string
  category: string
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  capacity: number
  metadata: any
  deleted_at: string | null
  created_at: string
  updated_at: string
  // Computed columns from the events_with_availability view
  confirmed_count: number
  waitlisted_count: number
  available_seats: number
  is_full: boolean
}

export interface DbRegistration {
  id: string
  event_id: string
  student_id: string
  status: 'confirmed' | 'cancelled' | 'waitlisted' | 'attended'
  checked_in_at: string | null
  created_at: string
  updated_at: string
}
