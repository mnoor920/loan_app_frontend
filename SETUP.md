# BrightLend Authentication Setup Guide

## Prerequisites
1. Node.js (v18 or higher)
2. Supabase account

## Setup Instructions

### 1. Install Dependencies
```bash
cd loan-app
npm install
```

### 2. Supabase Setup

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Get your Supabase credentials:**
   - Go to Settings > API
   - Copy the Project URL
   - Copy the `anon` public key
   - Copy the `service_role` secret key

3. **Set up the database:**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase-setup.sql`
   - Run the SQL script

### 3. Environment Configuration

1. **Update `.env.local`:**
```env
# Replace with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Generate a strong JWT secret
JWT_SECRET=your-super-secret-jwt-key-here

# Super Admin Credentials (you can change these)
SUPER_ADMIN_EMAIL=admin@brightlend.com
SUPER_ADMIN_PASSWORD=SuperAdmin@123
```

### 4. Run the Application

```bash
npm run dev
```

## Features Implemented

### Authentication System
- ✅ **Email Validation**: Proper email format validation
- ✅ **Pakistani Phone Number Validation**: Only accepts 03XXXXXXXXX format (11 digits)
- ✅ **Strong Password Requirements**: 
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter  
  - At least 1 number
  - At least 1 special character (@$!%*?&)

### Role Management
- ✅ **User Role**: Regular users → `/user/dashboard`
- ✅ **Super Admin Role**: Hardcoded admin → `/admin/dashboard`
- ✅ **Route Protection**: Middleware protects routes based on roles

### Security Features
- ✅ **JWT Tokens**: Secure authentication tokens
- ✅ **HTTP-Only Cookies**: Tokens stored securely
- ✅ **Password Hashing**: Bcrypt for password security
- ✅ **Input Validation**: Zod schema validation
- ✅ **CSRF Protection**: SameSite cookie settings

### Database Integration
- ✅ **Supabase Integration**: Full backend with PostgreSQL
- ✅ **User Profiles**: Extended user data storage
- ✅ **Row Level Security**: Database-level security policies

## Usage

### Super Admin Login
- Email: `admin@brightlend.com` (or your configured email)
- Password: `SuperAdmin@123` (or your configured password)
- Redirects to: `/admin/dashboard`

### Regular User
- Sign up with valid email and Pakistani phone number
- Strong password required
- Redirects to: `/user/dashboard`

### Phone Number Format
- Must be Pakistani format: `03XXXXXXXXX`
- Example: `03001234567`
- No spaces, dashes, or country codes

### Password Requirements
- Minimum 8 characters
- Example valid password: `MyPass123!`

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

## Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Check your environment variables
   - Ensure Supabase project is active
   - Verify API keys are correct

2. **Phone Number Validation**
   - Must start with `03`
   - Must be exactly 11 digits
   - No spaces or special characters

3. **Password Validation**
   - Check all requirements are met
   - Use a password like `MyPass123!`

4. **Database Errors**
   - Run the SQL setup script in Supabase
   - Check RLS policies are enabled
   - Verify service role key permissions

### Support
If you encounter issues, check:
1. Browser console for errors
2. Network tab for API responses
3. Supabase logs in dashboard
4. Environment variable configuration