// Loan database service for handling CRUD operations on loan data

import { supabase, supabaseAdmin } from './supabase';
import { 
  Loan, 
  LoanCreateData, 
  LoanUpdateData, 
  LoanQueryFilters,
  DashboardStats,
  LoanStatus 
} from '../types/loan';
import { calculateDashboardStats } from './loan-calculations';

export class LoanService {
  /**
   * Create a new loan application in the database
   * @param loanData - Loan data to create
   * @returns Created loan record
   */
  static async createLoan(loanData: LoanCreateData): Promise<Loan> {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .insert({
          user_id: loanData.userId,
          loan_amount: loanData.loanAmount,
          duration_months: loanData.durationMonths,
          interest_rate: loanData.interestRate,
          monthly_payment: loanData.monthlyPayment,
          total_amount: loanData.totalAmount,
          status: loanData.status || 'Pending Approval',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating loan:', error);
        throw new Error(`Failed to create loan: ${error.message}`);
      }

      return this.mapDatabaseRowToLoan(data);
    } catch (error) {
      console.error('Error in createLoan:', error);
      throw error;
    }
  }

  /**
   * Get all loans for a specific user
   * @param userId - User ID to fetch loans for
   * @param filters - Optional query filters
   * @returns Array of user's loans
   */
  static async getUserLoans(userId: string, filters?: LoanQueryFilters): Promise<Loan[]> {
    try {
      let query = supabase
        .from('loan_applications')
        .select('*')
        .eq('user_id', userId)
        .order('application_date', { ascending: false });

      // Apply filters if provided
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('application_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('application_date', filters.dateTo);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user loans:', error);
        throw new Error(`Failed to fetch loans: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseRowToLoan);
    } catch (error) {
      console.error('Error in getUserLoans:', error);
      throw error;
    }
  }

  /**
   * Get a specific loan by ID (with user ownership check)
   * @param loanId - Loan ID to fetch
   * @param userId - User ID for ownership verification
   * @returns Loan record or null if not found/not owned
   */
  static async getLoanById(loanId: string, userId: string): Promise<Loan | null> {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('id', loanId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching loan by ID:', error);
        throw new Error(`Failed to fetch loan: ${error.message}`);
      }

      return this.mapDatabaseRowToLoan(data);
    } catch (error) {
      console.error('Error in getLoanById:', error);
      throw error;
    }
  }

  /**
   * Update a loan record
   * @param loanId - Loan ID to update
   * @param userId - User ID for ownership verification
   * @param updateData - Data to update
   * @returns Updated loan record
   */
  static async updateLoan(
    loanId: string, 
    userId: string, 
    updateData: LoanUpdateData
  ): Promise<Loan> {
    try {
      const updatePayload: any = {};

      if (updateData.status) {
        updatePayload.status = updateData.status;
      }

      if (updateData.approvalDate) {
        updatePayload.approval_date = updateData.approvalDate;
      }

      if (updateData.firstPaymentDate) {
        updatePayload.first_payment_date = updateData.firstPaymentDate;
      }

      const { data, error } = await supabase
        .from('loan_applications')
        .update(updatePayload)
        .eq('id', loanId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating loan:', error);
        throw new Error(`Failed to update loan: ${error.message}`);
      }

      return this.mapDatabaseRowToLoan(data);
    } catch (error) {
      console.error('Error in updateLoan:', error);
      throw error;
    }
  }

  /**
   * Delete a loan record (soft delete by updating status)
   * @param loanId - Loan ID to delete
   * @param userId - User ID for ownership verification
   * @returns Success status
   */
  static async deleteLoan(loanId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('loan_applications')
        .delete()
        .eq('id', loanId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting loan:', error);
        throw new Error(`Failed to delete loan: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error in deleteLoan:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics for a user
   * @param userId - User ID to calculate stats for
   * @returns Dashboard statistics
   */
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const loans = await this.getUserLoans(userId);
      return calculateDashboardStats(loans);
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      // Return empty stats on error
      return {
        totalBalance: 0,
        totalLoanAmount: 0,
        nextPaymentDue: null,
        activeLoansCount: 0,
        pendingLoansCount: 0,
        completedLoansCount: 0,
      };
    }
  }

  /**
   * Get loans by status for admin purposes (requires admin client)
   * @param status - Loan status to filter by
   * @param limit - Maximum number of loans to return
   * @returns Array of loans with the specified status
   */
  static async getLoansByStatus(status: LoanStatus, limit: number = 50): Promise<Loan[]> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin access not available');
      }

      const { data, error } = await supabaseAdmin
        .from('loan_applications')
        .select(`
          *,
          users!inner(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('status', status)
        .order('application_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching loans by status:', error);
        throw new Error(`Failed to fetch loans: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseRowToLoan);
    } catch (error) {
      console.error('Error in getLoansByStatus:', error);
      throw error;
    }
  }

  /**
   * Approve a loan (admin function)
   * @param loanId - Loan ID to approve
   * @returns Updated loan record
   */
  static async approveLoan(loanId: string): Promise<Loan> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin access not available');
      }

      const approvalDate = new Date().toISOString();
      const firstPaymentDate = new Date();
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

      const { data, error } = await supabaseAdmin
        .from('loan_applications')
        .update({
          status: 'Approved',
          approval_date: approvalDate,
          first_payment_date: firstPaymentDate.toISOString().split('T')[0],
        })
        .eq('id', loanId)
        .select()
        .single();

      if (error) {
        console.error('Error approving loan:', error);
        throw new Error(`Failed to approve loan: ${error.message}`);
      }

      return this.mapDatabaseRowToLoan(data);
    } catch (error) {
      console.error('Error in approveLoan:', error);
      throw error;
    }
  }

  /**
   * Map database row to Loan interface
   * @param row - Database row data
   * @returns Loan object
   */
  private static mapDatabaseRowToLoan(row: any): Loan {
    return {
      id: row.id,
      userId: row.user_id,
      loanAmount: parseFloat(row.loan_amount),
      durationMonths: row.duration_months,
      interestRate: parseFloat(row.interest_rate),
      monthlyPayment: parseFloat(row.monthly_payment),
      totalAmount: parseFloat(row.total_amount),
      status: row.status as LoanStatus,
      applicationDate: row.application_date,
      approvalDate: row.approval_date,
      firstPaymentDate: row.first_payment_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Check if the loans table exists and is accessible
   * @returns Boolean indicating if the service is ready
   */
  static async isServiceReady(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('loan_applications')
        .select('id')
        .limit(1);

      return !error || error.code !== '42P01'; // 42P01 = table doesn't exist
    } catch (error) {
      console.error('Error checking loan service readiness:', error);
      return false;
    }
  }

  /**
   * Get total loan statistics across all users (admin function)
   * @returns System-wide loan statistics
   */
  static async getSystemStats(): Promise<{
    totalLoans: number;
    totalAmount: number;
    pendingApprovals: number;
    activeLoans: number;
  }> {
    try {
      if (!supabaseAdmin) {
        throw new Error('Admin access not available');
      }

      const { data, error } = await supabaseAdmin
        .from('loan_applications')
        .select('status, loan_amount');

      if (error) {
        throw new Error(`Failed to fetch system stats: ${error.message}`);
      }

      const stats = {
        totalLoans: data?.length || 0,
        totalAmount: 0,
        pendingApprovals: 0,
        activeLoans: 0,
      };

      data?.forEach(loan => {
        stats.totalAmount += parseFloat(loan.loan_amount);
        if (loan.status === 'Pending Approval') {
          stats.pendingApprovals++;
        } else if (loan.status === 'In Repayment' || loan.status === 'Approved') {
          stats.activeLoans++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        totalLoans: 0,
        totalAmount: 0,
        pendingApprovals: 0,
        activeLoans: 0,
      };
    }
  }
}