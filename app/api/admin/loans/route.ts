import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminAuth, createAdminErrorResponse, createAdminSuccessResponse } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) {
      return authError;
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      return createAdminErrorResponse(503, 'Admin service not available. Please contact system administrator.');
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'application_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    try {
      // Build the query for loan applications with user information
      let query = supabaseAdmin
        .from('loan_applications')
        .select(`
          id,
          application_number,
          loan_amount,
          loan_purpose,
          status,
          application_date,
          interest_rate,
          loan_duration,
          duration_months,
          created_at,
          users!inner (
            id,
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .order(sortBy === 'application_date' ? 'application_date' : 'created_at', { ascending: sortOrder === 'asc' });

      // Apply status filter
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply search filter
      if (search) {
        query = query.or(`
          application_number.ilike.%${search}%,
          loan_purpose.ilike.%${search}%,
          users.first_name.ilike.%${search}%,
          users.last_name.ilike.%${search}%,
          users.email.ilike.%${search}%
        `);
      }

      // Apply pagination
      const startRange = offset;
      const endRange = offset + limit - 1;
      query = query.range(startRange, endRange);

      const { data: loansData, error: loansError, count } = await query;

      if (loansError) {
        console.error('Error fetching loan applications:', loansError);
        throw new Error(`Failed to fetch loans: ${loansError.message}`);
      }

      // Get total count for pagination
      let totalQuery = supabaseAdmin
        .from('loan_applications')
        .select('id', { count: 'exact', head: true });

      if (status !== 'all') {
        totalQuery = totalQuery.eq('status', status);
      }

      if (search) {
        totalQuery = totalQuery.or(`
          application_number.ilike.%${search}%,
          loan_purpose.ilike.%${search}%,
          users.first_name.ilike.%${search}%,
          users.last_name.ilike.%${search}%,
          users.email.ilike.%${search}%
        `);
      }

      const { count: totalCount, error: countError } = await totalQuery;

      if (countError) {
        console.error('Error getting loan count:', countError);
      }

      // Transform data to match expected interface
      const loans = (loansData || []).map(loan => ({
        id: loan.id,
        applicationNumber: loan.application_number,
        loanAmount: loan.loan_amount,
        loanPurpose: loan.loan_purpose,
        status: loan.status,
        applicationDate: loan.application_date,
        interestRate: loan.interest_rate,
        loanDuration: loan.loan_duration || loan.duration_months,
        durationMonths: loan.duration_months,
        createdAt: loan.created_at,
        applicant: {
          id: (loan.users as any)?.id,
          firstName: (loan.users as any)?.first_name,
          lastName: (loan.users as any)?.last_name,
          email: (loan.users as any)?.email,
          phone: (loan.users as any)?.phone_number
        }
      }));

      return createAdminSuccessResponse(
        {
          loans,
          total: totalCount || 0,
          pagination: {
            limit,
            offset,
            hasMore: (totalCount || 0) > offset + limit
          }
        },
        `Retrieved ${loans.length} loan applications successfully.`
      );

    } catch (dbError: any) {
      console.error('Database error during loans retrieval:', dbError);

      // Handle specific database errors
      if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
        return createAdminErrorResponse(503, 'Loan applications table missing. Please ensure your database is properly set up.');
      }

      if (dbError.message.includes('connection') || dbError.message.includes('timeout')) {
        return createAdminErrorResponse(503, 'Database connection issue. Please try again in a few moments.');
      }

      // Generic database error
      return createAdminErrorResponse(500, 'Failed to retrieve loan applications. Please try again later.');
    }

  } catch (error: any) {
    console.error('Admin loans retrieval error:', error);
    return createAdminErrorResponse(500, 'An unexpected error occurred. Please try again later.');
  }
}