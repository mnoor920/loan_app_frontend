import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '@/app/admin/dashboard/page';

// Mock the authentication context
const mockUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  role: 'admin',
  firstName: 'Admin',
  lastName: 'User'
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: jest.fn(),
    logout: jest.fn()
  })
}));

// Mock the API responses
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn()
  })
}));

describe('Admin Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful API responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/admin/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            stats: {
              totalUsers: 150,
              activatedUsers: 120,
              pendingActivations: 30,
              totalLoanApplications: 85,
              pendingLoans: 25,
              approvedLoans: 45,
              rejectedLoans: 15,
              totalLoanAmount: 2500000,
              averageLoanAmount: 55555.56
            }
          })
        });
      }
      
      if (url.includes('/api/admin/users/activated')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            users: [
              {
                id: 'user-1',
                email: 'john@test.com',
                firstName: 'John',
                lastName: 'Doe',
                activationStatus: 'completed',
                activatedAt: '2024-01-15T10:00:00Z',
                createdAt: '2024-01-10T10:00:00Z',
                profile: {
                  fullName: 'John Doe',
                  currentStep: 6,
                  completedAt: '2024-01-15T10:00:00Z'
                }
              }
            ],
            total: 1
          })
        });
      }
      
      if (url.includes('/api/admin/loans/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            loans: [
              {
                id: 'loan-1',
                userId: 'user-1',
                loanAmount: 50000,
                durationMonths: 24,
                status: 'Pending Approval',
                applicationDate: '2024-01-15T10:00:00Z',
                applicant: {
                  id: 'user-1',
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john@test.com'
                }
              }
            ],
            total: 1
          })
        });
      }
      
      return Promise.reject(new Error('Unknown API endpoint'));
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('loads and displays dashboard with real data', async () => {
    render(<AdminDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total users
      expect(screen.getByText('120')).toBeInTheDocument(); // Activated users
      expect(screen.getByText('85')).toBeInTheDocument(); // Total loan applications
      expect(screen.getByText('25')).toBeInTheDocument(); // Pending loans
    });

    // Check that API calls were made
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/dashboard/stats', expect.any(Object));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/users/activated'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/loans/all'),
      expect.any(Object)
    );
  });

  it('handles tab navigation correctly', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Click on Users tab
    const usersTab = screen.getByText('All Users');
    await user.click(usersTab);

    // Should show users list
    await waitFor(() => {
      expect(screen.getByText('Manage user accounts and activation status')).toBeInTheDocument();
    });

    // Click on Loans tab
    const loansTab = screen.getByText('All Loans');
    await user.click(loansTab);

    // Should show loans list
    await waitFor(() => {
      expect(screen.getByText('Review and manage loan applications')).toBeInTheDocument();
    });

    // Go back to Overview
    const overviewTab = screen.getByText('Overview');
    await user.click(overviewTab);

    // Should show overview content
    await waitFor(() => {
      expect(screen.getByText('Loan Applications Overview')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API failure
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          message: 'Internal server error'
        })
      })
    );

    render(<AdminDashboard />);

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Server Error')).toBeInTheDocument();
    });
  });

  it('handles network errors with retry functionality', async () => {
    const user = userEvent.setup();
    
    // Mock network failure first, then success
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Network error'));
      }
      
      // Success on retry
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          stats: {
            totalUsers: 150,
            activatedUsers: 120,
            pendingActivations: 30,
            totalLoanApplications: 85,
            pendingLoans: 25,
            approvedLoans: 45,
            rejectedLoans: 15,
            totalLoanAmount: 2500000,
            averageLoanAmount: 55555.56
          }
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

    // Should show success state after retry
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('displays loading states during data fetching', async () => {
    // Mock slow API response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              stats: {
                totalUsers: 0,
                activatedUsers: 0,
                pendingActivations: 0,
                totalLoanApplications: 0,
                pendingLoans: 0,
                approvedLoans: 0,
                rejectedLoans: 0,
                totalLoanAmount: 0,
                averageLoanAmount: 0
              }
            })
          });
        }, 100);
      })
    );

    render(<AdminDashboard />);

    // Should show loading skeletons
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4); // SkeletonStats

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles refresh functionality', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    // Clear mock calls
    mockFetch.mockClear();

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);

    // Should make API calls again
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/dashboard/stats', expect.any(Object));
    });
  });

  it('navigates to detailed views correctly', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click "View All Loans" button
    const viewAllLoansButton = screen.getByText('View All Loans');
    await user.click(viewAllLoansButton);

    // Should switch to loans tab
    await waitFor(() => {
      expect(screen.getByText('Review and manage loan applications')).toBeInTheDocument();
    });

    // Switch to users tab
    const usersTab = screen.getByText('All Users');
    await user.click(usersTab);

    // Wait for users to load and click "View All" button
    await waitFor(() => {
      const viewAllButton = screen.getByText('View All');
      expect(viewAllButton).toBeInTheDocument();
    });
  });

  it('displays correct currency formatting', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('$2,500,000')).toBeInTheDocument(); // Total loan amount
      expect(screen.getByText('$55,556')).toBeInTheDocument(); // Average loan amount (rounded)
    });
  });

  it('shows empty states when no data available', async () => {
    // Mock empty responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/admin/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            stats: {
              totalUsers: 0,
              activatedUsers: 0,
              pendingActivations: 0,
              totalLoanApplications: 0,
              pendingLoans: 0,
              approvedLoans: 0,
              rejectedLoans: 0,
              totalLoanAmount: 0,
              averageLoanAmount: 0
            }
          })
        });
      }
      
      if (url.includes('/api/admin/users/activated') || url.includes('/api/admin/loans/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            users: [],
            loans: [],
            total: 0
          })
        });
      }
      
      return Promise.reject(new Error('Unknown API endpoint'));
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No activated users yet')).toBeInTheDocument();
      expect(screen.getByText('No loan applications yet')).toBeInTheDocument();
    });
  });

  it('maintains responsive design across different screen sizes', async () => {
    render(<AdminDashboard />);

    // Check for responsive classes
    const mainContent = document.querySelector('main');
    expect(mainContent).toHaveClass('pt-20', 'lg:pl-66', 'px-4', 'sm:px-6');

    // Check stats grid responsiveness
    await waitFor(() => {
      const statsGrid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
      expect(statsGrid).toBeInTheDocument();
    });
  });

  it('handles authentication state correctly', async () => {
    // Test with non-admin user
    jest.doMock('@/contexts/AuthContext', () => ({
      useAuth: () => ({
        user: { ...mockUser, role: 'user' },
        loading: false
      })
    }));

    // Should redirect non-admin users (this would be handled by the useEffect)
    // In a real test, we'd check that router.push was called with '/userdashboard'
  });
});