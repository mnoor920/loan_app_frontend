import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from './supabase'

export interface User {
  id: string
  email: string
  phoneNumber: string
  firstName: string
  lastName: string
  role: 'user' | 'admin' | 'superadmin'
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
}

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    return null
  }
}

export const createUser = async (userData: {
  email: string
  phoneNumber: string
  firstName: string
  lastName: string
  password: string
  role?: 'user' | 'admin' | 'superadmin'
}) => {
  const hashedPassword = await hashPassword(userData.password)

  if (!supabaseAdmin) {
    throw new Error('Server configuration error: Supabase Service Role Key missing')
  }

  // Create user in Supabase Auth first
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true
  })

  if (authError) {
    throw new Error(authError.message)
  }

  // Create user profile in our custom table
  const { data: user, error: dbError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authUser.user.id,
      email: userData.email,
      phone_number: userData.phoneNumber,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role || 'user'
    })
    .select()
    .single()

  if (dbError) {
    // Cleanup auth user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    throw new Error(dbError.message)
  }

  return user
}

export const getUserByEmailOrPhone = async (identifier: string) => {
  // Check if identifier is email or phone
  const isEmail = identifier.includes('@')

  if (!supabaseAdmin) throw new Error('Server configuration error: Supabase Service Role Key missing')

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .or(isEmail ? `email.eq.${identifier}` : `phone_number.eq.${identifier}`)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message)
  }

  return user
}

export const authenticateUser = async (identifier: string, password: string) => {
  // Check for super admin
  if (identifier === process.env.SUPER_ADMIN_EMAIL && password === process.env.SUPER_ADMIN_PASSWORD) {
    return {
      id: 'superadmin',
      email: process.env.SUPER_ADMIN_EMAIL!,
      phoneNumber: '',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin' as const
    }
  }

  const user = await getUserByEmailOrPhone(identifier)
  if (!user) {
    throw new Error('Invalid credentials')
  }

  // Try to sign in with Supabase Auth to verify password
  try {
    if (!supabaseAdmin) throw new Error('Server configuration error: Supabase Service Role Key missing')

    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email,
      password: password
    })

    if (signInError) {
      throw new Error('Invalid credentials')
    }

    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phone_number,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }
  } catch (error) {
    throw new Error('Invalid credentials')
  }
}