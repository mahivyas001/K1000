import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyUser, unauthorized, missingAuth } from '@/lib/api-auth'

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id')
  const user = await verifyUser(userId)
  if (!user) return missingAuth()
  if (user.role !== 'student') return unauthorized()

  const { eventId } = await req.json()
  const studentId = user.id 

  // Fetch event availability
  const { data: event } = await supabase.from('events_with_availability').select('*').eq('id', eventId).single()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (event.status === 'cancelled') return NextResponse.json({ error: 'Event is cancelled' }, { status: 400 })

  // DYNAMIC STATUS: If full, waitlist them. If not, confirm them.
  const registrationStatus = event.is_full ? 'waitlisted' : 'confirmed'

  const { data, error } = await supabase.from('registrations').insert({
    id: `reg-${Date.now()}`,
    event_id: eventId,
    student_id: studentId,
    status: registrationStatus
  }).select().single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You are already registered or on the waitlist' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    registration: data,
    message: registrationStatus === 'waitlisted' ? 'Added to waitlist' : 'Successfully registered'
  })
}
