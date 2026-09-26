import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyUser, unauthorized, missingAuth } from '@/lib/api-auth'

export async function POST(req: Request) {
  // 1. Extract user ID from header
  const userId = req.headers.get('x-user-id')
  const user = await verifyUser(userId)
  
  // 2. Verify Auth
  if (!user) return missingAuth()
  if (user.role !== 'organizer') return unauthorized()

  const body = await req.json()
  if (!body.name || !body.date || !body.venue || !body.capacity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // VALIDATION: Capacity cap
  const newCapacity = Number(body.capacity)
  if (newCapacity > 10000) {
    return NextResponse.json({ error: 'Capacity cannot exceed 10,000.' }, { status: 400 })
  }

  // 3. Force the organizer_id to be the authenticated user (prevents spoofing)
  const { data, error } = await supabase.from('events').insert({
    id: `evt-${Date.now()}`,
    name: body.name,
    description: body.description || '',
    date: body.date,
    venue: body.venue,
    category: body.category || 'Tech',
    capacity: newCapacity,
    organizer_id: user.id, // SECURED
    status: 'published'
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, event: data })
}
