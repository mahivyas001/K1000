import { supabase } from './supabase'
import { NextResponse } from 'next/server'

// Fetches the user from the DB to verify they exist and gets their role
export async function verifyUser(userId: string | null) {
  if (!userId) return null
  const { data } = await supabase.from('users').select('id, role').eq('id', userId).single()
  return data
}

// Standardized error responses
export const unauthorized = () => NextResponse.json({ error: 'Unauthorized: Invalid role' }, { status: 403 })
export const forbidden = () => NextResponse.json({ error: 'Forbidden: You do not own this resource' }, { status: 403 })
export const missingAuth = () => NextResponse.json({ error: 'Missing x-user-id header' }, { status: 401 })
