import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyUser, unauthorized, forbidden, missingAuth } from '@/lib/api-auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')
  const user = await verifyUser(userId)
  if (!user) return missingAuth()
  if (user.role !== 'organizer') return unauthorized()

  // 1. Fetch current event state (including confirmed_count from our View)
  const { data: currentEvent } = await supabase
    .from('events_with_availability')
    .select('*')
    .eq('id', params.id)
    .single()
    
  if (!currentEvent) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (currentEvent.organizer_id !== user.id) return forbidden()

  // VALIDATION: Zombie Event Check — lock editing once the event has passed
  if (new Date(currentEvent.date).getTime() < Date.now()) {
    return NextResponse.json({ 
      error: 'Cannot edit an event that has already occurred.' 
    }, { status: 400 })
  }

  const body = await req.json()

  // VALIDATION: Time Travel Check — new date cannot be set to the past
  const newDate = body.date ? new Date(body.date) : new Date(currentEvent.date)
  if (newDate.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Event date cannot be in the past' }, { status: 400 })
  }

  // VALIDATION: Shrinking Capacity Check
  const newCapacity = body.capacity ? Number(body.capacity) : currentEvent.capacity
  if (newCapacity < currentEvent.confirmed_count) {
    return NextResponse.json({ 
      error: `Cannot reduce capacity below ${currentEvent.confirmed_count} (current confirmed registrations).` 
    }, { status: 400 })
  }

  // VALIDATION: Capacity cap
  if (newCapacity > 10000) {
    return NextResponse.json({ error: 'Capacity cannot exceed 10,000.' }, { status: 400 })
  }

  // Perform Update — only pass known DB columns (snake_case) to avoid schema errors
  const updatePayload: Record<string, any> = {}
  if (body.name       !== undefined) updatePayload.name        = body.name
  if (body.date       !== undefined) updatePayload.date        = body.date
  if (body.venue      !== undefined) updatePayload.venue       = body.venue
  if (body.category   !== undefined) updatePayload.category    = body.category
  if (body.description !== undefined) updatePayload.description = body.description
  if (body.capacity   !== undefined) updatePayload.capacity    = newCapacity

  const { data, error } = await supabase
    .from('events')
    .update(updatePayload)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, event: data })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id')
  const user = await verifyUser(userId)
  if (!user) return missingAuth()
  if (user.role !== 'organizer') return unauthorized()

  // 1. Fetch event with availability
  const { data: currentEvent } = await supabase
    .from('events_with_availability')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!currentEvent) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (currentEvent.organizer_id !== user.id) return forbidden()

  // Check URL params to see if they want a hard delete or soft cancel
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (action === 'hard') {
    // HARD DELETE: Only allowed if no one is registered
    if (currentEvent.confirmed_count > 0 || currentEvent.waitlisted_count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete an event with active registrations. Please cancel it instead.' 
      }, { status: 400 })
    }
    
    const { error } = await supabase.from('events').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Event permanently deleted' })
  }

  // SOFT CANCEL (Default): Allowed anytime
  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled' })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // CASCADE CANCELLATION: Free up all students when an event is cancelled
  await supabase
    .from('registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', params.id)
    .in('status', ['confirmed', 'waitlisted'])

  return NextResponse.json({ success: true, message: 'Event and all registrations cancelled' })
}
