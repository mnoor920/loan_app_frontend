'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'user' | 'admin' | 'superadmin'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  signup: (data: any) => Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Making login request to:', `${API_URL}/api/auth/signin`);
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ identifier: email, password }),
      })

      console.log('AuthContext: Response status:', response.status);
      const data = await response.json()
      console.log('AuthContext: Response data:', data);

      if (response.ok) {
        setUser(data.user)
        console.log('AuthContext: Login successful, returning redirect:', data.redirectTo);
        return { success: true, redirectTo: data.redirectTo }
      } else {
        console.log('AuthContext: Login failed:', data.error);
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error occurred' }
    }
  }

  const signup = async (formData: any) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Backend now returns requiresEmailVerification logic
        // If successful signup but verification needed, data.user might be present or we check data structure
        if (data.token) {
          setUser(data.user)
        }
        return { success: true, requiresEmailVerification: data.requiresEmailVerification }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}