import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoansList from '@/components/admin/LoansList';

// Mock the hooks and API client
jest.mock('@/hooks/useErrorHandler', () => ({
  __esModule: true,
  default: () => ({
    error: null,
    hasError: false,
    isRetrying: false,
    canRetry: false,
    retryCount: 0,
    handleError: jest.fn(),
    clearError: jest.fn(),
    retry: jest.fn(),
    executeWithErrorHandling: jest.fn().mockResolvedValue({
      success: true,
      loans: [],
      total: 0
    })
  })
}));

jest.mock('@/lib/api-client', () => ({
  adminApi: {
    getAllLoans: jest.fn()
  }
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  })
}));

import useErrorHandler from '@/hooks/useErrorHandler';
import { adminApi } from '@/lib/api-client';

const mockUseErrorHandler = useErrorHandler as jest.MockedFunction<typeof useErrorHandler>;
const mockAdminApi = adminApi as jest.Mocked<typeof adminApi>;

describe('LoansList Component', () => {
  const mockLoans = [
    {
      id: 'loan-1',
      userId: 'user-1',
      loanAmount: 50000,
      durationMonths: 24,
      interestRate: 5.5,
      monthlyPayment: 2200,
      totalAmount: 52800,
      status: 'Pending Approval',
      applicationDate: '2024-01-15T10:00:00Z',
      approvalDate: null,
      firstPaymentDate: null,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      applicant: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phone: '+1234567890'
      }
    },
    {
      id: 'loan-2',
      userId: 'user-2',
      loanAmount: 75000,
      durationMonths: 36,
      interestRate: 6.0,
      monthlyPayment: 2280,
      totalAmount: 82080,
      status: 'Approved',
      applicationDate: '2024-01-14T10:00:00Z',
      approvalDate: '2024-01-16T10:00:00Z',
      firstPaymentDate: '2024-02-16T10:00:00Z',
      createdAt: '2024-01-14T10:00:00Z',
      updatedAt: '2024-01-16T10:00:00Z',
      applicant: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        phone: '+1234567891'
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful mock
    mockUseErrorHandler.mockReturnValue({
      error: null,
      hasError: false,
      isRetrying: false,
      canRetry: false,
      retryCount: 0,
      handleError: jest.fn(),
      clearError: jest.fn(),
      retry: jest.fn(),
      executeWithErrorHandling: jest.fn().mockResolvedValue({
        success: true,
        loans: mockLoans,
        total: 2,
        pagination: { hasMore: false }
      })
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders loans list with correct data', async () => {
    render(<LoansList />);

    // Check header
    expect(screen.getByText('All Loan Applications')).toBeInTheDocument();
    
    // Wait for loans to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Check loan details
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('jane@test.com')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('$75,000')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    // Mock loading state
    mockUseErrorHandler.mockReturnValue({
      error: null,
      hasError: false,
      isRetrying: false,
      canRetry: false,
      retryCount: 0,
      handleError: jest.fn(),
      clearError: jest.fn(),
      retry: jest.fn(),
      executeWithErrorHandling: jest.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
    });

    render(<LoansList />);

    // Should show loading message
    expect(screen.getByText('Loading applications...')).toBeInTheDocument();
    
    // Should show skeleton loading
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(10); // SkeletonList with 10 items
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    const mockExecuteWithErrorHandling = jest.fn().mockResolvedValue({
      success: true,
      loans: [mockLoans[0]], // Only John Doe's loan
      total: 1
    });

    mockUseErrorHandler.mockReturnValue({
      error: null,
      hasError: false,
      isRetrying: false,
      canRetry: false,
      retryCount: 0,
      handleError: jest.fn(),
      clearError: jest.fn(),
      retry: jest.fn(),
      executeWithErrorHandling: mockExecuteWithErrorHandling
    });

    render(<LoansList />);

    // Find and interact with search input
    const searchInput = screen.getByPlaceholderText('Search applications...');
    await user.type(searchInput, 'john');

    await waitFor(() => {
      expect(mockExecuteWithErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'fetch_loans'
      );
    });
  });

  it('handles status filter functionality', async () => {
    const user = userEvent.setup();
    const mockExecuteWithErrorHandling = jest.fn().mockResolvedValue({
      success: true,
      loans: [mockLoans[1]], // Only approved loans
      total: 1
    });

    mockUseErrorHandler.mockReturnValue({
      error: null,
      hasError: false,
      isRetrying: false,
      canRetry: false,
      retryCount: 0,
      handleError: jest.fn(),
      clearError: jest.fn(),
      retry: jest.fn(),
      executeWithErrorHandling: mockExecuteWithErrorHandling
    });

    render(<LoansList />);

    // Find and interact with status filter
    const statusFilter = screen.getByDisplayValue('All Status');
    await user.selectOptions(statusFilter, 'Approved');

    await waitFor(() => {
      expect(mockExecuteWithErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'fetch_loans'
      );
    });
  });

  it('displays error state correctly', () => {
    const mockError = {
      message: 'Failed to load loan applications',
      type: 'SERVER',
      status: 500,
      retryable: true
    };

    mockUseErrorHandler.mockReturnValue({
      error: mockError,
      hasError: true,
      isRetrying: false,
      canRetry: true,
      retryCount: 1,
      handleError: jest.fn(),
      clearError: jest.fn(),
      retry: jest.fn(),
      executeWithErrorHandling: jest.fn()
    });

    render(<LoansList />);

    // Should show error message
    expect(screen.getByText('Server Error')).toBeInTheDocument();
    expect(screen.getByText('Server error. Please try again in a few minutes.')).toBeInTheDocument();
    
    // Should show retry button
    expect(screen.getByText('Retry (2 left)')).toBeInTheDocument();
  });

  it('handles retry functionality', async () => {
    const user = userEvent.setup();
    const mockRetry = jest.fn();
    const mockError = {
      message: 'Server error',
      type: 'SERVER',
      status: 500,
      retryable: true
    };

    mockUseErrorHandler.mockReturnValue({
      error: mockError,
      hasError: true,
      isRetrying: false,
      canRetry: true,
      retryCount: 1,
      handleError: jest.fn(),
      clearError: jest.fn(),
      retry: mockRetry,
      executeWithErrorHandling: jest.fn()
    });

    render(<LoansList />);

    // Click retry button
    const retryButton = screen.getByText('Retry (2 left)');
    await user.click(retryButton);

    expect(mockRetry).toHaveBeenCalledWith(expect.any(Function));
  });

  it('displays empty state when no loans found', async () => {
    mockUseErrorHandler.mockReturnValue({
      error: null,
      hasError: false,
      isRetrying: false,
      canRetry: false,
      retryCount: 0,
      handleError: jest.fn(),
      clearError: jest.fn(),
      retry: jest.fn(),
      executeWithErrorHandling: jest.fn().mockResolvedValue({
        success: true,
        loans: [],
        total: 0
      })
    });

    render(<LoansList />);

    await waitFor(() => {
      expect(screen.getByText('No Loan Applications Found')).toBeInTheDocument();
      expect(screen.getByText('No loan applications have been submitted yet.')).toBeInTheDocument();
    });
  });

  it('displays correct status badges', async () => {
    render(<LoansList />);

    await waitFor(() => {
      // Check for status badges
      const pendingBadge = screen.getByText('Pending Approval');
      const approvedBadge = screen.getByText('Approved');
      
      expect(pendingBadge).toBeInTheDocument();
      expect(approvedBadge).toBeInTheDocument();
      
      // Check badge styling
      expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      expect(approvedBadge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  it('handles view details button clicks', async () => {
    const mockPush = jest.fn();
    
    // Mock useRouter
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        prefetch: jest.fn()
      })
    }));

    const user = userEvent.setup();
    render(<LoansList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click view details button for first loan
    const viewButtons = screen.getAllByText('View Details');
    await user.click(viewButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/adminloans/loan-1');
  });

  it('displays loan amounts with correct formatting', async () => {
    render(<LoansList />);

    await waitFor(() => {
      // Check formatted currency amounts
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('$75,000')).toBeInTheDocument();
    });
  });

  it('displays loan duration correctly', async () => {
    render(<LoansList />);

    await waitFor(() => {
      // Check loan durations
      expect(screen.getByText('24 months')).toBeInTheDocument();
      expect(screen.getByText('36 months')).toBeInTheDocument();
    });
  });

  it('formats application dates correctly', async () => {
    render(<LoansList />);

    await waitFor(() => {
      // Check formatted dates
      expect(screen.getByText('Applied: Jan 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('Applied: Jan 14, 2024')).toBeInTheDocument();
    });
  });

  it('displays applicant avatars with correct initials', async () => {
    render(<LoansList />);

    await waitFor(() => {
      // Check for avatar initials
      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe
      expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith
    });
  });

  it('shows refresh indicator', async () => {
    render(<LoansList />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  it('handles pagination when total pages > 1', async () => {
    mockUseErrorHandler.mockReturnValue({
      error: null,
      hasError: false,
      isRetrying: false,
      canRetry: false,
      retryCount: 0,
      handleError: jest.fn(),
      clearError: jest.fn(),
      retry: jest.fn(),
      executeWithErrorHandling: jest.fn().mockResolvedValue({
        success: true,
        loans: mockLoans,
        total: 50, // More than 20 (default page size)
        pagination: { hasMore: true }
      })
    });

    render(<LoansList />);

    await waitFor(() => {
      // Should show pagination
      expect(screen.getByText('50 total applications')).toBeInTheDocument();
      expect(screen.getByText('Showing 1 to 2 of 50 results')).toBeInTheDocument();
    });
  });

  it('displays status icons correctly', async () => {
    render(<LoansList />);

    await waitFor(() => {
      // Check for status icons (they should be in the DOM as SVG elements)
      const statusIcons = document.querySelectorAll('svg');
      expect(statusIcons.length).toBeGreaterThan(0);
    });
  });

  it('handles empty search results', async () => {
    mockUseErrorHandler.mockReturnValue({
      error: null,
      hasError: false,
      isRetrying: false,
      canRetry: false,
      retryCount: 0,
      handleError: jest.fn(),
      clearError: jest.fn(),
      retry: jest.fn(),
      executeWithErrorHandling: jest.fn().mockResolvedValue({
        success: true,
        loans: [],
        total: 0
      })
    });

    const user = userEvent.setup();
    render(<LoansList />);

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search applications...');
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText('No Loan Applications Found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
    });
  });

  it('applies correct CSS classes for responsive design', () => {
    render(<LoansList />);

    const container = screen.getByText('All Loan Applications').closest('.bg-white');
    expect(container).toHaveClass('rounded-lg', 'border', 'border-gray-200', 'dark:border-gray-800');
  });
});