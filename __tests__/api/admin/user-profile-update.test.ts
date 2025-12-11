import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/admin/users/[userId]/profile/route';

// Mock the database connection
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  beginTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
}));

// Mock the authentication
jest.mock('@/lib/auth', () => ({
  verifyAdminToken: jest.fn(),
}));

// Mock the validation
jest.mock('@/lib/validation', () => ({
  validateUserProfile: jest.fn(),
}));

import { query, beginTransaction, commitTransaction, rollbackTransaction } from '@/lib/db';
import { verifyAdminToken } from '@/lib/auth';
import { validateUserProfile } from '@/lib/validation';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBeginTransaction = beginTransaction as jest.MockedFunction<typeof beginTransaction>;
const mockCommitTransaction = commitTransaction as jest.MockedFunction<typeof commitTransaction>;
const mockRollbackTransaction = rollbackTransaction as jest.MockedFunction<typeof rollbackTransaction>;
const mockVerifyAdminToken = verifyAdminToken as jest.MockedFunction<typeof verifyAdminToken>;
const mockValidateUserProfile = validateUserProfile as jest.MockedFunction<typeof validateUserProfile>;

describe('/api/admin/users/[userId]/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default admin authentication
    mockVerifyAdminToken.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'admin'
    });

    // Default validation success
    mockValidateUserProfile.mockReturnValue({ isValid: true, errors: [] });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('PUT', () => {
    const validProfileData = {
      fullName: 'John Doe Updated',
      dateOfBirth: '1990-01-15',
      nationality: 'American',
      residingCountry: 'United States',
      stateRegionProvince: 'California',
      townCity: 'San Francisco',
      idType: 'passport',
      idNumber: 'P123456789',
      bankName: 'Chase Bank',
      accountNumber: '1234567890',
      accountHolderName: 'John Doe',
      adminId: 'admin-1',
      reason: 'Correcting personal information'
    };

    it('should successfully update user profile', async () => {
      const mockUpdatedProfile = {
        id: 'profile-1',
        user_id: 'user-1',
        full_name: 'John Doe Updated',
        date_of_birth: '1990-01-15',
        nationality: 'American',
        residing_country: 'United States',
        state_region_province: 'California',
        town_city: 'San Francisco',
        id_type: 'passport',
        id_number: 'P123456789',
        bank_name: 'Chase Bank',
        account_number: '1234567890',
        account_holder_name: 'John Doe',
        updated_at: '2024-01-20T10:00:00Z'
      };

      mockQuery
        .mockResolvedValueOnce([{ id: 'profile-1' }]) // Check profile exists
        .mockResolvedValueOnce([mockUpdatedProfile]) // Update profile
        .mockResolvedValueOnce([{ id: 'log-1' }]) // Create modification log
        .mockResolvedValueOnce([{ id: 'notification-1' }]); // Create notification

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1/profile', {
        method: 'PUT',
        body: JSON.stringify(validProfileData)
      });

      const response = await PUT(request, { params: { userId: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile.fullName).toBe('John Doe Updated');
      expect(data.notification.sent).toBe(true);
      expect(data.notification.type).toBe('profile_updated');
    });

    it('should validate profile data before updating', async () => {
      mockValidateUserProfile.mockReturnValue({
        isValid: false,
        errors: ['Full name is required', 'Invalid date of birth']
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...validProfileData, fullName: '', dateOfBirth: 'invalid' })
      });

      const response = await PUT(request, { params: { userId: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
      expect(data.errors).toEqual(['Full name is required', 'Invalid date of birth']);
    });

    it('should require admin ID and reason', async () => {
      const requestWithoutAdminId = new NextRequest('http://localhost:3000/api/admin/users/user-1/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...validProfileData, adminId: undefined })
      });

      const response1 = await PUT(requestWithoutAdminId, { params: { userId: 'user-1' } });
      const data1 = await response1.json();

      expect(response1.status).toBe(400);
      expect(data1.success).toBe(false);
      expect(data1.message).toBe('Admin ID is required');

      const requestWithoutReason = new NextRequest('http://localhost:3000/api/admin/users/user-1/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...validProfileData, reason: undefined })
      });

      const response2 = await PUT(requestWithoutReason, { params: { userId: 'user-1' } });
      const data2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(data2.success).toBe(false);
      expect(data2.message).toBe('Reason for modification is required');
    });

    it('should return 404 if user profile not found', async () => {
      mockQuery.mockResolvedValueOnce([]); // Profile not found

      const request = new NextRequest('http://localhost:3000/api/admin/users/nonexistent-user/profile', {
        method: 'PUT',
        body: JSON.stringify(validProfileData)
      });

      const response = await PUT(request, { params: { userId: 'nonexistent-user' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('User profile not found');
    });

    it('should handle database transaction rollback on error', async () => {
      mockQuery
        .mockResolvedValueOnce([{ id: 'profile-1' }]) // Check profile exists
        .mockResolvedValueOnce([]) // Update profile succeeds
        .mockRejectedValueOnce(new Error('Database error')); // Modification log fails

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1/profile', {
        method: 'PUT',
        body: JSON.stringify(validProfileData)
      });

      const response = await PUT(request, { params: { userId: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(mockRollbackTransaction).toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockVerifyAdminToken.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1/profile', {
        method: 'PUT',
        body: JSON.stringify(validProfileData)
      });

      const response = await PUT(request, { params: { userId: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 403 for non-admin users', async () => {
      mockVerifyAdminToken.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        role: 'user'
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1/profile', {
        method: 'PUT',
        body: JSON.stringify(validProfileData)
      });

      const response = await PUT(request, { params: { userId: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should handle malformed JSON request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1/profile', {
        method: 'PUT',
        body: 'invalid json'
      });

      const response = await PUT(request, { params: { userId: 'user-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid request body');
    });

    it('should create modification log with correct data', async () => {
      const mockProfile = { id: 'profile-1', full_name: 'John Doe' };
      
      mockQuery
        .mockResolvedValueOnce([mockProfile]) // Check profile exists
        .mockResolvedValueOnce([{ ...mockProfile, full_name: 'John Doe Updated' }]) // Update profile
        .mockResolvedValueOnce([{ id: 'log-1' }]) // Create modification log
        .mockResolvedValueOnce([{ id: 'notification-1' }]); // Create notification

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1/profile', {
        method: 'PUT',
        body: JSON.stringify(validProfileData)
      });

      await PUT(request, { params: { userId: 'user-1' } });

      // Verify modification log creation
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO admin_modification_log'),
        expect.arrayContaining([
          'admin-1',
          'admin@test.com',
          'user_profile',
          'user-1',
          'profile_update',
          expect.any(String), // old_value JSON
          expect.any(String), // new_value JSON
          'Correcting personal information'
        ])
      );
    });

    it('should create user notification with correct data', async () => {
      const mockProfile = { id: 'profile-1' };
      
      mockQuery
        .mockResolvedValueOnce([mockProfile]) // Check profile exists
        .mockResolvedValueOnce([mockProfile]) // Update profile
        .mockResolvedValueOnce([{ id: 'log-1' }]) // Create modification log
        .mockResolvedValueOnce([{ id: 'notification-1' }]); // Create notification

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1/profile', {
        method: 'PUT',
        body: JSON.stringify(validProfileData)
      });

      await PUT(request, { params: { userId: 'user-1' } });

      // Verify notification creation
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_notifications'),
        expect.arrayContaining([
          'user-1',
          'profile_updated',
          'Profile Updated',
          expect.stringContaining('Your profile information has been updated'),
          expect.any(String) // data JSON
        ])
      );
    });
  });
});