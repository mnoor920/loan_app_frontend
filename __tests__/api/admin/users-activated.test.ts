import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/users/activated/route';

// Mock the database connection
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

// Mock the authentication
jest.mock('@/lib/auth', () => ({
  verifyAdminToken: jest.fn(),
}));

import { query } from '@/lib/db';
import { verifyAdminToken } from '@/lib/auth';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockVerifyAdminToken = verifyAdminToken as jest.MockedFunction<typeof verifyAdminToken>;

describe('/api/admin/users/activated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default admin authentication
    mockVerifyAdminToken.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'admin'
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET', () => {
    it('should return paginated list of activated users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890',
          activation_status: 'completed',
          activated_at: '2024-01-15T10:00:00Z',
          created_at: '2024-01-10T10:00:00Z',
          profile_id: 'profile-1',
          full_name: 'John Doe',
          current_step: 6,
          completed_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'user-2',
          email: 'user2@test.com',
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+1234567891',
          activation_status: 'completed',
          activated_at: '2024-01-14T10:00:00Z',
          created_at: '2024-01-09T10:00:00Z',
          profile_id: 'profile-2',
          full_name: 'Jane Smith',
          current_step: 6,
          completed_at: '2024-01-14T10:00:00Z'
        }
      ];

      mockQuery
        .mockResolvedValueOnce(mockUsers) // Users query
        .mockResolvedValueOnce([{ count: '25' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/users/activated?limit=20&offset=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.users).toHaveLength(2);
      expect(data.total).toBe(25);
      expect(data.users[0]).toEqual({
        id: 'user-1',
        email: 'user1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        activationStatus: 'completed',
        activatedAt: '2024-01-15T10:00:00Z',
        createdAt: '2024-01-10T10:00:00Z',
        profile: {
          id: 'profile-1',
          fullName: 'John Doe',
          currentStep: 6,
          completedAt: '2024-01-15T10:00:00Z'
        }
      });
    });

    it('should handle search parameter', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Users query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/users/activated?search=john');
      const response = await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['%john%'])
      );
    });

    it('should handle status filter', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Users query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/users/activated?status=completed');
      const response = await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('activation_status = $'),
        expect.arrayContaining(['completed'])
      );
    });

    it('should handle pagination parameters', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Users query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/users/activated?limit=10&offset=20');
      const response = await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $'),
        expect.arrayContaining([10, 20])
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockVerifyAdminToken.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/admin/users/activated');
      const response = await GET(request);
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

      const request = new NextRequest('http://localhost:3000/api/admin/users/activated');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/users/activated');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch activated users');
    });

    it('should return empty array when no users found', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Users query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/users/activated');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.users).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should validate and sanitize limit parameter', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Users query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      // Test with limit > 100 (should be capped at 100)
      const request = new NextRequest('http://localhost:3000/api/admin/users/activated?limit=150');
      const response = await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $'),
        expect.arrayContaining([100]) // Should be capped at 100
      );
    });

    it('should validate and sanitize offset parameter', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Users query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      // Test with negative offset (should default to 0)
      const request = new NextRequest('http://localhost:3000/api/admin/users/activated?offset=-10');
      const response = await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('OFFSET $'),
        expect.arrayContaining([0]) // Should default to 0
      );
    });
  });
});