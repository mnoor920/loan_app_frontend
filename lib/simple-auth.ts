import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from './supabase'

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

export const createUser = async (userData: {
  email: string
  phoneNumber: string
  firstName: string
  lastName: string
  password: string
  role?: 'user' | 'admin' | 'superadmin'
}) => {
  const hashedPassword = await hashPassword(userData.password)
  const userId = crypto.randomUUID()
  
  // Create user profile in our custom table
  const { data: user, error: dbError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: userData.email,
      phone_number: userData.phoneNumber,
      first_name: userData.firstName,
      last_name: userData.lastName,
      password_hash: hashedPassword,
      role: userData.role || 'user'
    })
    .select()
    .single()

  if (dbError) {
    throw new Error(dbError.message)
  }

  return user
}

export const getUserByEmailOrPhone = async (identifier: string) => {
  // Check if identifier is email or phone
  const isEmail = identifier.includes('@')
  
  const { data: user, error } = await supabase
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

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash)
  if (!isValidPassword) {
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
}