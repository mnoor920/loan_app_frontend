import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/dashboard/stats/route';

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

describe('/api/admin/dashboard/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET', () => {
    it('should return dashboard statistics for authenticated admin', async () => {
      // Mock admin authentication
      mockVerifyAdminToken.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin'
      });

      // Mock database queries
      mockQuery
        .mockResolvedValueOnce([{ count: '150' }]) // Total users
        .mockResolvedValueOnce([{ count: '120' }]) // Activated users
        .mockResolvedValueOnce([{ count: '30' }])  // Pending activations
        .mockResolvedValueOnce([{ count: '85' }])  // Total loan applications
        .mockResolvedValueOnce([{ count: '25' }])  // Pending loans
        .mockResolvedValueOnce([{ count: '45' }])  // Approved loans
        .mockResolvedValueOnce([{ count: '15' }])  // Rejected loans
        .mockResolvedValueOnce([{ total: '2500000', average: '55555.56' }]); // Loan amounts

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toEqual({
        totalUsers: 150,
        activatedUsers: 120,
        pendingActivations: 30,
        totalLoanApplications: 85,
        pendingLoans: 25,
        approvedLoans: 45,
        rejectedLoans: 15,
        totalLoanAmount: 2500000,
        averageLoanAmount: 55555.56
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockVerifyAdminToken.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 403 for non-admin users', async () => {
      mockVerifyAdminToken.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        role: 'user'
      });

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Admin access required');
    });

    it('should handle database errors gracefully', async () => {
      mockVerifyAdminToken.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin'
      });

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch dashboard statistics');
    });

    it('should return zero values when no data exists', async () => {
      mockVerifyAdminToken.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin'
      });

      // Mock empty results
      mockQuery
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([{ total: null, average: null }]);

      const request = new NextRequest('http://localhost:3000/api/admin/dashboard/stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toEqual({
        totalUsers: 0,
        activatedUsers: 0,
        pendingActivations: 0,
        totalLoanApplications: 0,
        pendingLoans: 0,
        approvedLoans: 0,
        rejectedLoans: 0,
        totalLoanAmount: 0,
        averageLoanAmount: 0
      });
    });
  });
});