import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/admin/loans/[loanId]/route';

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
  validateLoanForm: jest.fn(),
}));

import { query, beginTransaction, commitTransaction, rollbackTransaction } from '@/lib/db';
import { verifyAdminToken } from '@/lib/auth';
import { validateLoanForm } from '@/lib/validation';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBeginTransaction = beginTransaction as jest.MockedFunction<typeof beginTransaction>;
const mockCommitTransaction = commitTransaction as jest.MockedFunction<typeof commitTransaction>;
const mockRollbackTransaction = rollbackTransaction as jest.MockedFunction<typeof rollbackTransaction>;
const mockVerifyAdminToken = verifyAdminToken as jest.MockedFunction<typeof verifyAdminToken>;
const mockValidateLoanForm = validateLoanForm as jest.MockedFunction<typeof validateLoanForm>;

describe('/api/admin/loans/[loanId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default admin authentication
    mockVerifyAdminToken.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'admin'
    });

    // Default validation success
    mockValidateLoanForm.mockReturnValue({ isValid: true, errors: [] });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('PUT', () => {
    const validLoanData = {
      loanAmount: 60000,
      durationMonths: 36,
      interestRate: 6.5,
      status: 'Approved',
      adminNotes: 'Approved after review',
      adminId: 'admin-1',
      reason: 'Loan approved based on credit score'
    };

    it('should successfully update loan application', async () => {
      const mockOriginalLoan = {
        id: 'loan-1',
        user_id: 'user-1',
        loan_amount: 50000,
        duration_months: 24,
        interest_rate: 5.5,
        status: 'Pending Approval',
        admin_notes: null
      };

      const mockUpdatedLoan = {
        ...mockOriginalLoan,
        loan_amount: 60000,
        duration_months: 36,
        interest_rate: 6.5,
        status: 'Approved',
        admin_notes: 'Approved after review',
        updated_at: '2024-01-20T10:00:00Z'
      };

      mockQuery
        .mockResolvedValueOnce([mockOriginalLoan]) // Get original loan
        .mockResolvedValueOnce([mockUpdatedLoan]) // Update loan
        .mockResolvedValueOnce([{ id: 'log-1' }]) // Create modification log
        .mockResolvedValueOnce([{ id: 'notification-1' }]); // Create notification

      const request = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify(validLoanData)
      });

      const response = await PUT(request, { params: { loanId: 'loan-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.loan.loanAmount).toBe(60000);
      expect(data.loan.status).toBe('Approved');
      expect(data.notification.sent).toBe(true);
      expect(data.notification.type).toBe('loan_status_changed');
    });

    it('should validate loan data before updating', async () => {
      mockValidateLoanForm.mockReturnValue({
        isValid: false,
        errors: ['Loan amount must be positive', 'Invalid interest rate']
      });

      const request = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify({ ...validLoanData, loanAmount: -1000, interestRate: 150 })
      });

      const response = await PUT(request, { params: { loanId: 'loan-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
      expect(data.errors).toEqual(['Loan amount must be positive', 'Invalid interest rate']);
    });

    it('should require admin ID and reason', async () => {
      const requestWithoutAdminId = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify({ ...validLoanData, adminId: undefined })
      });

      const response1 = await PUT(requestWithoutAdminId, { params: { loanId: 'loan-1' } });
      const data1 = await response1.json();

      expect(response1.status).toBe(400);
      expect(data1.success).toBe(false);
      expect(data1.message).toBe('Admin ID is required');

      const requestWithoutReason = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify({ ...validLoanData, reason: undefined })
      });

      const response2 = await PUT(requestWithoutReason, { params: { loanId: 'loan-1' } });
      const data2 = await response2.json();

      expect(response2.status).toBe(400);
      expect(data2.success).toBe(false);
      expect(data2.message).toBe('Reason for modification is required');
    });

    it('should return 404 if loan not found', async () => {
      mockQuery.mockResolvedValueOnce([]); // Loan not found

      const request = new NextRequest('http://localhost:3000/api/admin/loans/nonexistent-loan', {
        method: 'PUT',
        body: JSON.stringify(validLoanData)
      });

      const response = await PUT(request, { params: { loanId: 'nonexistent-loan' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Loan application not found');
    });

    it('should handle status change notifications correctly', async () => {
      const mockOriginalLoan = {
        id: 'loan-1',
        user_id: 'user-1',
        status: 'Pending Approval'
      };

      mockQuery
        .mockResolvedValueOnce([mockOriginalLoan]) // Get original loan
        .mockResolvedValueOnce([{ ...mockOriginalLoan, status: 'Rejected' }]) // Update loan
        .mockResolvedValueOnce([{ id: 'log-1' }]) // Create modification log
        .mockResolvedValueOnce([{ id: 'notification-1' }]); // Create notification

      const request = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify({ ...validLoanData, status: 'Rejected' })
      });

      const response = await PUT(request, { params: { loanId: 'loan-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notification.type).toBe('loan_status_changed');
      
      // Verify notification creation with status change data
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_notifications'),
        expect.arrayContaining([
          'user-1',
          'loan_status_changed',
          'Loan Status Updated',
          expect.stringContaining('Your loan application status has been updated'),
          expect.stringContaining('"oldStatus":"Pending Approval"')
        ])
      );
    });

    it('should handle loan details modification notifications', async () => {
      const mockOriginalLoan = {
        id: 'loan-1',
        user_id: 'user-1',
        loan_amount: 50000,
        status: 'Approved'
      };

      mockQuery
        .mockResolvedValueOnce([mockOriginalLoan]) // Get original loan
        .mockResolvedValueOnce([{ ...mockOriginalLoan, loan_amount: 60000 }]) // Update loan
        .mockResolvedValueOnce([{ id: 'log-1' }]) // Create modification log
        .mockResolvedValueOnce([{ id: 'notification-1' }]); // Create notification

      const request = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify({ ...validLoanData, status: 'Approved' }) // Same status, different amount
      });

      const response = await PUT(request, { params: { loanId: 'loan-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notification.type).toBe('loan_details_modified');
    });

    it('should calculate monthly payment when loan details change', async () => {
      const mockOriginalLoan = {
        id: 'loan-1',
        user_id: 'user-1',
        loan_amount: 50000,
        duration_months: 24,
        interest_rate: 5.5
      };

      mockQuery
        .mockResolvedValueOnce([mockOriginalLoan]) // Get original loan
        .mockResolvedValueOnce([{ 
          ...mockOriginalLoan, 
          loan_amount: 60000,
          monthly_payment: 2650.45 // Expected calculated value
        }]) // Update loan
        .mockResolvedValueOnce([{ id: 'log-1' }]) // Create modification log
        .mockResolvedValueOnce([{ id: 'notification-1' }]); // Create notification

      const request = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify(validLoanData)
      });

      const response = await PUT(request, { params: { loanId: 'loan-1' } });

      // Verify that the update query includes calculated monthly payment
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('monthly_payment = $'),
        expect.arrayContaining([expect.any(Number)])
      );
    });

    it('should handle database transaction rollback on error', async () => {
      mockQuery
        .mockResolvedValueOnce([{ id: 'loan-1' }]) // Get original loan
        .mockResolvedValueOnce([]) // Update loan succeeds
        .mockRejectedValueOnce(new Error('Database error')); // Modification log fails

      const request = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify(validLoanData)
      });

      const response = await PUT(request, { params: { loanId: 'loan-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(mockRollbackTransaction).toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockVerifyAdminToken.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify(validLoanData)
      });

      const response = await PUT(request, { params: { loanId: 'loan-1' } });
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

      const request = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify(validLoanData)
      });

      const response = await PUT(request, { params: { loanId: 'loan-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should create modification log with before and after values', async () => {
      const mockOriginalLoan = {
        id: 'loan-1',
        user_id: 'user-1',
        loan_amount: 50000,
        status: 'Pending Approval'
      };

      const mockUpdatedLoan = {
        ...mockOriginalLoan,
        loan_amount: 60000,
        status: 'Approved'
      };

      mockQuery
        .mockResolvedValueOnce([mockOriginalLoan]) // Get original loan
        .mockResolvedValueOnce([mockUpdatedLoan]) // Update loan
        .mockResolvedValueOnce([{ id: 'log-1' }]) // Create modification log
        .mockResolvedValueOnce([{ id: 'notification-1' }]); // Create notification

      const request = new NextRequest('http://localhost:3000/api/admin/loans/loan-1', {
        method: 'PUT',
        body: JSON.stringify(validLoanData)
      });

      await PUT(request, { params: { loanId: 'loan-1' } });

      // Verify modification log creation with before/after values
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO admin_modification_log'),
        expect.arrayContaining([
          'admin-1',
          'admin@test.com',
          'loan',
          'loan-1',
          'loan_update',
          expect.stringContaining('"loan_amount":50000'), // old_value
          expect.stringContaining('"loan_amount":60000'), // new_value
          'Loan approved based on credit score'
        ])
      );
    });
  });
});