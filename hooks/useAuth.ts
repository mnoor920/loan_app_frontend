'use client'
import { useEffect, useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) throw new Error('Not authenticated')

        const data = await res.json()
        setUser(data.user)
      } catch (err) {
        console.error('Auth error', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading }
}
