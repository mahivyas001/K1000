import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyUser, unauthorized, forbidden, missingAuth } from '@/lib/api-auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')
  const user = await verifyUser(userId)
  if (!user) return missingAuth()
  if (user.role !== 'organizer') return unauthorized()

  // Verify ownership
  const { data: event } = await supabase.from('events').select('organizer_id').eq('id', params.id).single()
  if (!event || event.organizer_id !== user.id) return forbidden()

  // Fetch registrations with student details
  const { data, error } = await supabase
    .from('registrations')
    .select('id, student_id, status, created_at, users(name, email)')
    .eq('event_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attendees: data })
}
