export type UserRole = 'student' | 'organizer'

export interface AppUser {
  id: string
  name: string
  role: UserRole
}

export const users: AppUser[] = [
  { id: 'stu-1', name: 'Aditi Rao (Student)', role: 'student' },
  { id: 'stu-2', name: 'Kabir Singh (Student)', role: 'student' },
  { id: 'stu-3', name: 'Meera Iyer (Student)', role: 'student' },
  { id: 'stu-4', name: 'Arjun Das (Student)', role: 'student' },
  { id: 'stu-5', name: 'Sneha Patil (Student)', role: 'student' },
  { id: 'stu-6', name: 'Vikram Shah (Student)', role: 'student' },
  { id: 'stu-7', name: 'Ananya Gupta (Student)', role: 'student' },
  { id: 'stu-8', name: 'Rohan Mehra (Student)', role: 'student' },
  { id: 'stu-9', name: 'Tara Desai (Student)', role: 'student' },
  { id: 'stu-10', name: 'Dev Joshi (Student)', role: 'student' },
  { id: 'stu-11', name: 'Kavya Nair [Waitlisted] (Student)', role: 'student' },
  { id: 'stu-12', name: 'Siddharth Rao [Waitlisted] (Student)', role: 'student' },
  { id: 'stu-13', name: 'Ishaan Kapoor [Waitlisted] (Student)', role: 'student' },
  { id: 'stu-14', name: 'Neha Reddy (Student)', role: 'student' },
  { id: 'stu-15', name: 'Aarav Malhotra (Student)', role: 'student' },
  { id: 'org-1', name: 'Rohan Verma (Organizer)', role: 'organizer' },
]

export function getUserById(id: string): AppUser | undefined {
  return users.find((user) => user.id === id)
}
