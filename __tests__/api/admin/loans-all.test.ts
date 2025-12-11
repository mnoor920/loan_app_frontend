import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/loans/all/route';

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

describe('/api/admin/loans/all', () => {
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
    it('should return paginated list of loan applications', async () => {
      const mockLoans = [
        {
          id: 'loan-1',
          user_id: 'user-1',
          loan_amount: 50000,
          duration_months: 24,
          interest_rate: 5.5,
          monthly_payment: 2200,
          total_amount: 52800,
          status: 'Pending Approval',
          loan_purpose: 'Business expansion',
          application_date: '2024-01-15T10:00:00Z',
          approval_date: null,
          first_payment_date: null,
          admin_notes: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@test.com',
          phone: '+1234567890'
        },
        {
          id: 'loan-2',
          user_id: 'user-2',
          loan_amount: 75000,
          duration_months: 36,
          interest_rate: 6.0,
          monthly_payment: 2280,
          total_amount: 82080,
          status: 'Approved',
          loan_purpose: 'Home renovation',
          application_date: '2024-01-14T10:00:00Z',
          approval_date: '2024-01-16T10:00:00Z',
          first_payment_date: '2024-02-16T10:00:00Z',
          admin_notes: 'Good credit history',
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-16T10:00:00Z',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@test.com',
          phone: '+1234567891'
        }
      ];

      mockQuery
        .mockResolvedValueOnce(mockLoans) // Loans query
        .mockResolvedValueOnce([{ count: '15' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/loans/all?limit=20&offset=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.loans).toHaveLength(2);
      expect(data.total).toBe(15);
      expect(data.loans[0]).toEqual({
        id: 'loan-1',
        userId: 'user-1',
        loanAmount: 50000,
        durationMonths: 24,
        interestRate: 5.5,
        monthlyPayment: 2200,
        totalAmount: 52800,
        status: 'Pending Approval',
        loanPurpose: 'Business expansion',
        applicationDate: '2024-01-15T10:00:00Z',
        approvalDate: null,
        firstPaymentDate: null,
        adminNotes: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        applicant: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          phone: '+1234567890'
        }
      });
    });

    it('should handle search parameter', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Loans query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/loans/all?search=john');
      const response = await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['%john%'])
      );
    });

    it('should handle status filter', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Loans query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/loans/all?status=Approved');
      const response = await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('l.status = $'),
        expect.arrayContaining(['Approved'])
      );
    });

    it('should handle sorting parameters', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Loans query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/loans/all?sortBy=loan_amount&sortOrder=asc');
      const response = await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY loan_amount ASC'),
        expect.any(Array)
      );
    });

    it('should validate sortBy parameter against allowed fields', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Loans query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      // Test with invalid sortBy field
      const request = new NextRequest('http://localhost:3000/api/admin/loans/all?sortBy=invalid_field');
      const response = await GET(request);

      // Should default to application_date DESC
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY application_date DESC'),
        expect.any(Array)
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockVerifyAdminToken.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/admin/loans/all');
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

      const request = new NextRequest('http://localhost:3000/api/admin/loans/all');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/admin/loans/all');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to fetch loan applications');
    });

    it('should return empty array when no loans found', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Loans query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/loans/all');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.loans).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should handle combined search and filter parameters', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Loans query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      const request = new NextRequest('http://localhost:3000/api/admin/loans/all?search=john&status=Approved&sortBy=loan_amount&sortOrder=desc');
      const response = await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['%john%', 'Approved'])
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY loan_amount DESC'),
        expect.any(Array)
      );
    });

    it('should validate and cap pagination limits', async () => {
      mockQuery
        .mockResolvedValueOnce([]) // Loans query
        .mockResolvedValueOnce([{ count: '0' }]); // Count query

      // Test with limit > 100 (should be capped)
      const request = new NextRequest('http://localhost:3000/api/admin/loans/all?limit=200');
      const response = await GET(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $'),
        expect.arrayContaining([100]) // Should be capped at 100
      );
    });
  });
});