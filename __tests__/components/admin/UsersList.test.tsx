import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersList from '@/components/admin/UsersList';

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
      users: [],
      total: 0
    })
  })
}));

jest.mock('@/lib/api-client', () => ({
  adminApi: {
    getActivatedUsers: jest.fn()
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

describe('UsersList Component', () => {
  const mockUsers = [
    {
      id: 'user-1',
      email: 'john@test.com',
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
    },
    {
      id: 'user-2',
      email: 'jane@test.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567891',
      activationStatus: 'in_progress',
      activatedAt: '2024-01-14T10:00:00Z',
      createdAt: '2024-01-09T10:00:00Z',
      profile: {
        id: 'profile-2',
        fullName: 'Jane Smith',
        currentStep: 4,
        completedAt: null
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
        users: mockUsers,
        total: 2,
        pagination: { hasMore: false }
      })
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders users list with correct data', async () => {
    render(<UsersList />);

    // Check header
    expect(screen.getByText('All Users')).toBeInTheDocument();
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Check user details
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('jane@test.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('+1234567891')).toBeInTheDocument();
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

    render(<UsersList />);

    // Should show loading message
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
    
    // Should show skeleton loading
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(10); // SkeletonList with 10 items
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    const mockExecuteWithErrorHandling = jest.fn().mockResolvedValue({
      success: true,
      users: [mockUsers[0]], // Only John Doe
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

    render(<UsersList />);

    // Find and interact with search input
    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'john');

    await waitFor(() => {
      expect(mockExecuteWithErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'fetch_users'
      );
    });
  });

  it('handles status filter functionality', async () => {
    const user = userEvent.setup();
    const mockExecuteWithErrorHandling = jest.fn().mockResolvedValue({
      success: true,
      users: [mockUsers[0]], // Only completed users
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

    render(<UsersList />);

    // Find and interact with status filter
    const statusFilter = screen.getByDisplayValue('All Status');
    await user.selectOptions(statusFilter, 'completed');

    await waitFor(() => {
      expect(mockExecuteWithErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'fetch_users'
      );
    });
  });

  it('displays error state correctly', () => {
    const mockError = {
      message: 'Failed to load users',
      type: 'NETWORK',
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

    render(<UsersList />);

    // Should show error message
    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText('Connection problem. Please check your internet and try again.')).toBeInTheDocument();
    
    // Should show retry button
    expect(screen.getByText('Retry (2 left)')).toBeInTheDocument();
  });

  it('handles retry functionality', async () => {
    const user = userEvent.setup();
    const mockRetry = jest.fn();
    const mockError = {
      message: 'Network error',
      type: 'NETWORK',
      status: 0,
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

    render(<UsersList />);

    // Click retry button
    const retryButton = screen.getByText('Retry (2 left)');
    await user.click(retryButton);

    expect(mockRetry).toHaveBeenCalledWith(expect.any(Function));
  });

  it('displays empty state when no users found', async () => {
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
        users: [],
        total: 0
      })
    });

    render(<UsersList />);

    await waitFor(() => {
      expect(screen.getByText('No Users Found')).toBeInTheDocument();
      expect(screen.getByText('No users have been registered yet.')).toBeInTheDocument();
    });
  });

  it('displays correct status badges', async () => {
    render(<UsersList />);

    await waitFor(() => {
      // Check for status badges
      const completedBadge = screen.getByText('Completed');
      const inProgressBadge = screen.getByText('In Progress');
      
      expect(completedBadge).toBeInTheDocument();
      expect(inProgressBadge).toBeInTheDocument();
      
      // Check badge styling
      expect(completedBadge).toHaveClass('bg-green-100', 'text-green-800');
      expect(inProgressBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  it('handles view profile button clicks', async () => {
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
    render(<UsersList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click view profile button for first user
    const viewButtons = screen.getAllByText('View Profile');
    await user.click(viewButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/adminusers/user-1');
  });

  it('displays user avatars with correct initials', async () => {
    render(<UsersList />);

    await waitFor(() => {
      // Check for avatar initials
      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe
      expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith
    });
  });

  it('formats dates correctly', async () => {
    render(<UsersList />);

    await waitFor(() => {
      // Check formatted dates
      expect(screen.getByText('Joined: Jan 10, 2024')).toBeInTheDocument();
      expect(screen.getByText('Joined: Jan 9, 2024')).toBeInTheDocument();
      expect(screen.getByText('Activated: Jan 15, 2024')).toBeInTheDocument();
    });
  });

  it('shows refresh indicator', async () => {
    render(<UsersList />);

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
        users: mockUsers,
        total: 50, // More than 20 (default page size)
        pagination: { hasMore: true }
      })
    });

    render(<UsersList />);

    await waitFor(() => {
      // Should show pagination
      expect(screen.getByText('50 total users')).toBeInTheDocument();
      expect(screen.getByText('Showing 1 to 2 of 50 results')).toBeInTheDocument();
    });
  });

  it('applies correct CSS classes for responsive design', () => {
    render(<UsersList />);

    const container = screen.getByText('All Users').closest('.bg-white');
    expect(container).toHaveClass('rounded-lg', 'border', 'border-gray-200', 'dark:border-gray-800');
  });
});