'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { tokenStorage } from '@/lib/token-storage'
import { apiFetch } from '@/lib/api-client'

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

  // Check authentication status using token from localStorage
  const checkAuth = async () => {
    try {
      const token = tokenStorage.getToken()

      if (!token) {
        setLoading(false)
        return
      }

      const response = await apiFetch('/api/auth/me', {
        skipAuth: false, // Will use token from localStorage via apiFetch
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Token is invalid, clear it
        tokenStorage.removeToken()
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      tokenStorage.removeToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Making login request to: /api/auth/signin');
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('AuthContext: Response status:', response.status);
      const data = await response.json()
      console.log('AuthContext: Response data:', data);

      if (response.ok) {
        // Store token in localStorage
        if (data.token) {
          tokenStorage.setToken(data.token)
          console.log('AuthContext: Token stored in localStorage');
        }

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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage if provided
        if (data.token) {
          tokenStorage.setToken(data.token)
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
      await apiFetch('/api/auth/logout', { method: 'POST' })
      tokenStorage.removeToken()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
      // Clear token and user even if API call fails
      tokenStorage.removeToken()
      setUser(null)
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