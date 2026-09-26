import { supabase } from '@/lib/supabase'
import { DbRegistration } from '@/types/database'

export async function getRegistrationsForStudent(studentId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as DbRegistration[]
}

export async function getUserRegistrationForEvent(studentId: string, eventId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .select('id, status')
    .eq('student_id', studentId)
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'waitlisted'])
    .maybeSingle() // Returns null if not found, instead of throwing an error
  if (error) throw error
  return data
}
