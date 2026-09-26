import { describe, it, expect, vi } from 'vitest'
import { getRegistrationsForStudent } from '@/data/registrations'

// 1. Mock the Supabase client so it doesn't hit the real database
vi.mock('@/lib/supabase', () => {
  const mockData = [
    { id: 'reg-01', event_id: 'evt-01', student_id: 'stu-1', status: 'confirmed' },
    { id: 'reg-02', event_id: 'evt-04', student_id: 'stu-1', status: 'attended' },
    { id: 'reg-03', event_id: 'evt-09', student_id: 'stu-1', status: 'confirmed' },
  ]

  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            // Mock the final promise resolution
            order: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
          }))
        }))
      }))
    }
  }
})

describe('getRegistrationsForStudent', () => {
  // 2. Make the test async
  it('returns only the seeded registrations belonging to that student', async () => {
    const mine = await getRegistrationsForStudent('stu-1')
    
    expect(mine.length).toBe(3)
    // 3. Update to match our new snake_case database schema
    expect(mine.every((reg) => reg.student_id === 'stu-1')).toBe(true)
  })
})
