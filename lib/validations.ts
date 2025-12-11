import { z } from 'zod'

// Pakistani phone number validation (11 digits starting with 03)
const pakistaniPhoneRegex = /^03\d{9}$/

// Password validation (at least 8 chars, uppercase, lowercase, number, special char)
// Allowed special characters: @$!%*?&#^()_+=[\]{}|\\:";'<>,./-
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export const signUpSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name too long'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name too long'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().regex(pakistaniPhoneRegex, 'Please enter a valid Pakistani phone number (03XXXXXXXXX)'),
  password: z.string().regex(passwordRegex, 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const signInSchema = z.object({
  email: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required')
})

export type SignUpData = z.infer<typeof signUpSchema>
export type SignInData = z.infer<typeof signInSchema>