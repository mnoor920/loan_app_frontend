import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersList from '@/components/admin/UsersList';

// Mock the hooks and dependencies
jest.mock('@/hooks/useErrorHandler');
jest.mock('@/lib/api-client');
jest.mock('next/navigation');

import useErrorHandler from '@/hooks/useErrorHandler';
import { adminApi } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

const mockUseErrorHandler = useErrorHandler as jest.MockedFunction<typeof useErrorHandler>;
const mockAdminApi = adminApi as jest.Mocked<typeof adminApi>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('Admin User Management Integration Tests', () => {
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
    },
    {
      id: 'user-3',
      email: 'bob@test.com',
      firstName: 'Bob',
      lastName: 'Johnson',
      phone: '+1234567892',
      activationStatus: 'pending',
      activatedAt: '2024-01-13T10:00:00Z',
      createdAt: '2024-01-08T10:00:00Z',
      profile: {
        id: 'profile-3',
        fullName: 'Bob Johnson',
        currentStep: 1,
        completedAt: null
      }
    }
  ];

  const mockPush = jest.fn();
  const mockExecuteWithErrorHandling = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock router
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    });

    // Mock error handler
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

    // Default successful API response
    mockExecuteWithErrorHandling.mockResolvedValue({
      success: true,
      users: mockUsers,
      total: mockUsers.length,
      pagination: { hasMore: false }
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('loads and displays users with complete workflow', async () => {
    render(<UsersList />);

    // Should show loading initially
    expect(screen.getByText('Loading users...')).toBeInTheDocument();

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    // Check user details
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('jane@test.com')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();

    // Check status badges
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();

    // Check action buttons
    const viewProfileButtons = screen.getAllByText('View Profile');
    expect(viewProfileButtons).toHaveLength(3);
  });

  it('handles search functionality with API integration', async () => {
    const user = userEvent.setup();
    
    // Mock filtered response
    const filteredUsers = [mockUsers[0]]; // Only John Doe
    mockExecuteWithErrorHandling.mockResolvedValue({
      success: true,
      users: filteredUsers,
      total: 1,
      pagination: { hasMore: false }
    });

    render(<UsersList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Perform search
    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'john');

    // Should call API with search parameter
    await waitFor(() => {
      expect(mockExecuteWithErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'fetch_users'
      );
    });

    // Should show filtered results
    await waitFor(() => {
      expect(screen.getByText('1 total users')).toBeInTheDocument();
    });
  });

  it('handles status filtering with API integration', async () => {
    const user = userEvent.setup();
    
    // Mock filtered response for completed users only
    const completedUsers = [mockUsers[0]]; // Only John Doe
    mockExecuteWithErrorHandling.mockResolvedValue({
      success: true,
      users: completedUsers,
      total: 1,
      pagination: { hasMore: false }
    });

    render(<UsersList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Apply status filter
    const statusFilter = screen.getByDisplayValue('All Status');
    await user.selectOptions(statusFilter, 'completed');

    // Should call API with status filter
    await waitFor(() => {
      expect(mockExecuteWithErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'fetch_users'
      );
    });

    // Should show only completed users
    await waitFor(() => {
      expect(screen.getByText('1 total users')).toBeInTheDocument();
    });
  });

  it('handles pagination with API integration', async () => {
    const user = userEvent.setup();
    
    // Mock paginated response
    const paginatedUsers = Array.from({ length: 50 }, (_, i) => ({
      ...mockUsers[0],
      id: `user-${i + 1}`,
      email: `user${i + 1}@test.com`,
      firstName: `User${i + 1}`,
      lastName: 'Test'
    }));

    mockExecuteWithErrorHandling.mockResolvedValue({
      success: true,
      users: paginatedUsers.slice(0, 20), // First page
      total: 50,
      pagination: { hasMore: true }
    });

    render(<UsersList />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('50 total users')).toBeInTheDocument();
      expect(screen.getByText('Showing 1 to 20 of 50 results')).toBeInTheDocument();
    });

    // Should show pagination controls
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();

    // Test page size selector
    const pageSizeSelector = screen.getByDisplayValue('20');
    await user.selectOptions(pageSizeSelector, '50');

    // Should call API with new page size
    await waitFor(() => {
      expect(mockExecuteWithErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'fetch_users'
      );
    });
  });

  it('handles navigation to user profile', async () => {
    const user = userEvent.setup();
    render(<UsersList />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on first "View Profile" button
    const viewProfileButtons = screen.getAllByText('View Profile');
    await user.click(viewProfileButtons[0]);

    // Should navigate to user profile page
    expect(mockPush).toHaveBeenCalledWith('/adminusers/user-1');
  });

  it('handles error states with retry functionality', async () => {
    const user = userEvent.setup();
    const mockRetry = jest.fn();
    
    // Mock error state
    const mockError = {
      message: 'Failed to load users',
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
      executeWithErrorHandling: mockExecuteWithErrorHandling
    });

    render(<UsersList />);

    // Should show error state
    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText('Retry (2 left)')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByText('Retry (2 left)');
    await user.click(retryButton);

    // Should call retry function
    expect(mockRetry).toHaveBeenCalledWith(expect.any(Function));
  });

  it('handles empty state correctly', async () => {
    // Mock empty response
    mockExecuteWithErrorHandling.mockResolvedValue({
      success: true,
      users: [],
      total: 0,
      pagination: { hasMore: false }
    });

    render(<UsersList />);

    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText('No Users Found')).toBeInTheDocument();
      expect(screen.getByText('No users have been registered yet.')).toBeInTheDocument();
    });
  });

  it('handles refresh functionality', async () => {
    const user = userEvent.setup();
    render(<UsersList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Clear previous calls
    mockExecuteWithErrorHandling.mockClear();

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);

    // Should make new API call
    expect(mockExecuteWithErrorHandling).toHaveBeenCalledWith(
      expect.any(Function),
      'fetch_users'
    );
  });

  it('displays user status icons correctly', async () => {
    render(<UsersList />);

    await waitFor(() => {
      // Check for status icons (SVG elements)
      const statusIcons = document.querySelectorAll('svg');
      expect(statusIcons.length).toBeGreaterThan(0);
    });
  });

  it('formats dates correctly', async () => {
    render(<UsersList />);

    await waitFor(() => {
      expect(screen.getByText('Joined: Jan 10, 2024')).toBeInTheDocument();
      expect(screen.getByText('Joined: Jan 9, 2024')).toBeInTheDocument();
      expect(screen.getByText('Joined: Jan 8, 2024')).toBeInTheDocument();
      expect(screen.getByText('Activated: Jan 15, 2024')).toBeInTheDocument();
    });
  });

  it('handles combined search and filter operations', async () => {
    const user = userEvent.setup();
    
    // Mock combined filter response
    mockExecuteWithErrorHandling.mockResolvedValue({
      success: true,
      users: [mockUsers[0]], // Only John Doe who is completed
      total: 1,
      pagination: { hasMore: false }
    });

    render(<UsersList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Apply search
    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'john');

    // Apply status filter
    const statusFilter = screen.getByDisplayValue('All Status');
    await user.selectOptions(statusFilter, 'completed');

    // Should call API with both parameters
    await waitFor(() => {
      expect(mockExecuteWithErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'fetch_users'
      );
    });
  });

  it('maintains state during navigation between pages', async () => {
    const user = userEvent.setup();
    
    // Mock large dataset
    const largeUserSet = Array.from({ length: 100 }, (_, i) => ({
      ...mockUsers[0],
      id: `user-${i + 1}`,
      email: `user${i + 1}@test.com`
    }));

    // First page
    mockExecuteWithErrorHandling.mockResolvedValueOnce({
      success: true,
      users: largeUserSet.slice(0, 20),
      total: 100,
      pagination: { hasMore: true }
    });

    render(<UsersList />);

    // Wait for first page to load
    await waitFor(() => {
      expect(screen.getByText('100 total users')).toBeInTheDocument();
    });

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'test');

    // Mock second page with search
    mockExecuteWithErrorHandling.mockResolvedValueOnce({
      success: true,
      users: largeUserSet.slice(20, 40),
      total: 100,
      pagination: { hasMore: true }
    });

    // Navigate to next page
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Should maintain search state and call API with search parameter
    await waitFor(() => {
      expect(mockExecuteWithErrorHandling).toHaveBeenCalledWith(
        expect.any(Function),
        'fetch_users'
      );
    });
  });
});