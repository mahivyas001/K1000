import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.tests.ts'],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://ptseidoowzyliggxcjgq.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0c2VpZG9vd3p5bGlnZ3hjamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzOTQyNDgsImV4cCI6MjEwNTk3MDI0OH0.5OEVLs7qs2GZDt2zlEFctHtkx_dpwNUnJRhT8Hv3eCA'
    }
  },
})
