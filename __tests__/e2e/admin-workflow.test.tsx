import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the entire admin dashboard workflow
const mockUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  role: 'admin',
  firstName: 'Admin',
  lastName: 'User'
};

// Mock authentication context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: jest.fn(),
    logout: jest.fn()
  })
}));

// Mock API responses for complete workflow
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  })
}));

// Import components after mocks
import AdminDashboard from '@/app/admin/dashboard/page';

describe('Admin Workflow End-to-End Tests', () => {
  const mockDashboardStats = {
    totalUsers: 150,
    activatedUsers: 120,
    pendingActivations: 30,
    totalLoanApplications: 85,
    pendingLoans: 25,
    approvedLoans: 45,
    rejectedLoans: 15,
    totalLoanAmount: 2500000,
    averageLoanAmount: 55555.56
  };

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
    
    // Setup default API responses
    mockFetch.mockImplementation((url: string, options?: any) => {
      const urlObj = new URL(url, 'http://localhost');
      const pathname = urlObj.pathname;
      const searchParams = urlObj.searchParams;

      // Dashboard stats
      if (pathname === '/api/admin/dashboard/stats') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            stats: mockDashboardStats
          })
        });
      }

      // Users endpoints
      if (pathname === '/api/admin/users/activated') {
        const search = searchParams.get('search');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        let filteredUsers = [...mockUsers];
        
        if (search) {
          filteredUsers = filteredUsers.filter(user => 
            user.firstName.toLowerCase().includes(search.toLowerCase()) ||
            user.lastName.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        if (status && status !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.activationStatus === status);
        }

        const paginatedUsers = filteredUsers.slice(offset, offset + limit);

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            users: paginatedUsers,
            total: filteredUsers.length,
            pagination: {
              hasMore: offset + limit < filteredUsers.length
            }
          })
        });
      }

      // User profile endpoint
      if (pathname.match(/\/api\/admin\/users\/(.+)\/profile$/)) {
        const userId = pathname.split('/')[4];
        const user = mockUsers.find(u => u.id === userId);
        
        if (options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              profile: user?.profile || null
            })
          });
        }
        
        if (options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              profile: user?.profile || null,
              notification: {
                sent: true,
                type: 'profile_updated'
              }
            })
          });
        }
      }

      // Loans endpoints
      if (pathname === '/api/admin/loans/all') {
        const search = searchParams.get('search');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        let filteredLoans = [...mockLoans];
        
        if (search) {
          filteredLoans = filteredLoans.filter(loan => 
            loan.applicant.firstName.toLowerCase().includes(search.toLowerCase()) ||
            loan.applicant.lastName.toLowerCase().includes(search.toLowerCase()) ||
            loan.applicant.email.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        if (status && status !== 'all') {
          filteredLoans = filteredLoans.filter(loan => loan.status === status);
        }

        const paginatedLoans = filteredLoans.slice(offset, offset + limit);

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            loans: paginatedLoans,
            total: filteredLoans.length,
            pagination: {
              hasMore: offset + limit < filteredLoans.length
            }
          })
        });
      }

      // Loan details endpoint
      if (pathname.match(/\/api\/admin\/loans\/(.+)\/details$/)) {
        const loanId = pathname.split('/')[4];
        const loan = mockLoans.find(l => l.id === loanId);
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            loan: loan || null
          })
        });
      }

      // Loan update endpoint
      if (pathname.match(/\/api\/admin\/loans\/(.+)$/) && options?.method === 'PUT') {
        const loanId = pathname.split('/')[4];
        const loan = mockLoans.find(l => l.id === loanId);
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            loan: loan || null,
            notification: {
              sent: true,
              type: 'loan_status_changed'
            }
          })
        });
      }

      return Promise.reject(new Error(`Unhandled API endpoint: ${pathname}`));
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('completes full admin dashboard workflow', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    // 1. Dashboard loads with statistics
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total users
      expect(screen.getByText('85')).toBeInTheDocument(); // Total loan applications
    });

    // 2. Navigate to Users tab
    const usersTab = screen.getByText('All Users');
    await user.click(usersTab);

    // 3. Users list loads
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // 4. Search for specific user
    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'john');

    await waitFor(() => {
      expect(screen.getByText('john@test.com')).toBeInTheDocument();
    });

    // 5. Clear search and filter by status
    await user.clear(searchInput);
    
    const statusFilter = screen.getByDisplayValue('All Status');
    await user.selectOptions(statusFilter, 'completed');

    await waitFor(() => {
      // Should show only completed users
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=completed'),
        expect.any(Object)
      );
    });

    // 6. Navigate to Loans tab
    const loansTab = screen.getByText('All Loans');
    await user.click(loansTab);

    // 7. Loans list loads
    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('$75,000')).toBeInTheDocument();
      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
    });

    // 8. Filter loans by status
    const loanStatusFilter = screen.getByDisplayValue('All Status');
    await user.selectOptions(loanStatusFilter, 'Pending Approval');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=Pending%20Approval'),
        expect.any(Object)
      );
    });

    // 9. Navigate back to Overview
    const overviewTab = screen.getByText('Overview');
    await user.click(overviewTab);

    // 10. Verify overview content is displayed
    await waitFor(() => {
      expect(screen.getByText('Loan Applications Overview')).toBeInTheDocument();
      expect(screen.getByText('Recently Activated Users')).toBeInTheDocument();
    });
  });

  it('handles error recovery workflow', async () => {
    const user = userEvent.setup();
    
    // Mock initial failure then success
    let callCount = 0;
    mockFetch.mockImplementation((url: string) => {
      callCount++;
      
      if (callCount <= 3) {
        // First few calls fail
        return Promise.reject(new Error('Network error'));
      }
      
      // Subsequent calls succeed
      if (url.includes('/api/admin/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            stats: mockDashboardStats
          })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          users: mockUsers,
          loans: mockLoans,
          total: 2
        })
      });
    });

    render(<AdminDashboard />);

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText(/Retry/);
    await user.click(retryButton);

    // Should eventually show success state
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('handles user management workflow with navigation', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Navigate to users tab
    const usersTab = screen.getByText('All Users');
    await user.click(usersTab);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on "View Profile" for first user
    const viewProfileButtons = screen.getAllByText('View Profile');
    await user.click(viewProfileButtons[0]);

    // Should navigate to user profile page
    expect(mockPush).toHaveBeenCalledWith('/adminusers/user-1');
  });

  it('handles loan management workflow with status changes', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    // Navigate to loans tab
    const loansTab = screen.getByText('All Loans');
    await user.click(loansTab);

    // Wait for loans to load
    await waitFor(() => {
      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    });

    // Click on "View Details" for first loan
    const viewDetailsButtons = screen.getAllByText('View Details');
    await user.click(viewDetailsButtons[0]);

    // Should navigate to loan details page
    expect(mockPush).toHaveBeenCalledWith('/adminloans/loan-1');
  });

  it('handles pagination workflow across multiple pages', async () => {
    const user = userEvent.setup();
    
    // Mock large dataset
    const largeUserSet = Array.from({ length: 100 }, (_, i) => ({
      ...mockUsers[0],
      id: `user-${i + 1}`,
      email: `user${i + 1}@test.com`,
      firstName: `User${i + 1}`,
      lastName: 'Test'
    }));

    // Override fetch for pagination test
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/admin/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            stats: { ...mockDashboardStats, totalUsers: 100 }
          })
        });
      }
      
      if (url.includes('/api/admin/users/activated')) {
        const urlObj = new URL(url, 'http://localhost');
        const limit = parseInt(urlObj.searchParams.get('limit') || '20');
        const offset = parseInt(urlObj.searchParams.get('offset') || '0');
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            users: largeUserSet.slice(offset, offset + limit),
            total: 100,
            pagination: {
              hasMore: offset + limit < 100
            }
          })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, loans: [], total: 0 })
      });
    });

    render(<AdminDashboard />);

    // Navigate to users tab
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    const usersTab = screen.getByText('All Users');
    await user.click(usersTab);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('100 total users')).toBeInTheDocument();
      expect(screen.getByText('Showing 1 to 20 of 100 results')).toBeInTheDocument();
    });

    // Test page size change
    const pageSizeSelector = screen.getByDisplayValue('20');
    await user.selectOptions(pageSizeSelector, '50');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });
  });

  it('handles refresh functionality across all tabs', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Clear mock calls
    mockFetch.mockClear();

    // Test refresh on overview tab
    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/dashboard/stats', expect.any(Object));
    });

    // Navigate to users tab and test refresh
    const usersTab = screen.getByText('All Users');
    await user.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    mockFetch.mockClear();
    const usersRefreshButton = screen.getByText('Refresh');
    await user.click(usersRefreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/activated'),
        expect.any(Object)
      );
    });

    // Navigate to loans tab and test refresh
    const loansTab = screen.getByText('All Loans');
    await user.click(loansTab);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    mockFetch.mockClear();
    const loansRefreshButton = screen.getByText('Refresh');
    await user.click(loansRefreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/loans/all'),
        expect.any(Object)
      );
    });
  });

  it('maintains state consistency across tab navigation', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Navigate to users tab and apply search
    const usersTab = screen.getByText('All Users');
    await user.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'john');

    // Navigate to loans tab
    const loansTab = screen.getByText('All Loans');
    await user.click(loansTab);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    // Navigate back to users tab
    await user.click(usersTab);

    // Search should be maintained
    await waitFor(() => {
      expect(searchInput).toHaveValue('john');
    });
  });
});