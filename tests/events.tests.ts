import { describe, it, expect } from 'vitest'
import { isPastEvent, events } from '@/data/events'

describe('isPastEvent', () => {
  it('marks an event with a date before TODAY as past', () => {
    // Create a mock event that is definitely in the past
    const pastEvent = { 
      ...events[0], 
      date: '2020-01-01T10:00:00Z' // Hardcode a past date
    }
    
    expect(isPastEvent(pastEvent)).toBe(true)
  })

  it('marks an event with a future date as not past', () => {
    const futureEvent = {
      ...events[0],
      date: '2099-01-01T10:00:00Z' // Hardcode a future date
    }
    
    expect(isPastEvent(futureEvent)).toBe(false)
  })
})
