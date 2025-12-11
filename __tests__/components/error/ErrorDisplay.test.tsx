import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorDisplay, { SuccessDisplay } from '@/components/error/ErrorDisplay';
import { AdminError, ErrorType } from '@/lib/error-handling';

describe('ErrorDisplay Component', () => {
  const mockOnRetry = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Banner variant', () => {
    it('renders network error correctly', () => {
      const error = new AdminError(
        'Connection failed',
        ErrorType.NETWORK,
        0,
        'NETWORK_ERROR',
        undefined,
        true
      );

      render(
        <ErrorDisplay
          error={error}
          onRetry={mockOnRetry}
          onDismiss={mockOnDismiss}
          canRetry={true}
          variant="banner"
        />
      );

      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(screen.getByText('Connection problem. Please check your internet and try again.')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('renders authentication error correctly', () => {
      const error = new AdminError(
        'Token expired',
        ErrorType.AUTHENTICATION,
        401,
        'AUTH_ERROR'
      );

      render(
        <ErrorDisplay
          error={error}
          variant="banner"
        />
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Your session has expired. Please log in again.')).toBeInTheDocument();
    });

    it('renders authorization error correctly', () => {
      const error = new AdminError(
        'Access denied',
        ErrorType.AUTHORIZATION,
        403,
        'ACCESS_DENIED'
      );

      render(
        <ErrorDisplay
          error={error}
          variant="banner"
        />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('You don\'t have permission for this action.')).toBeInTheDocument();
    });

    it('renders validation error correctly', () => {
      const error = new AdminError(
        'Invalid input data',
        ErrorType.VALIDATION,
        400,
        'VALIDATION_ERROR'
      );

      render(
        <ErrorDisplay
          error={error}
          variant="banner"
        />
      );

      expect(screen.getByText('Validation Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid input data')).toBeInTheDocument();
    });

    it('renders server error correctly', () => {
      const error = new AdminError(
        'Internal server error',
        ErrorType.SERVER,
        500,
        'SERVER_ERROR',
        undefined,
        true
      );

      render(
        <ErrorDisplay
          error={error}
          canRetry={true}
          variant="banner"
        />
      );

      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(screen.getByText('Server error. Please try again in a few minutes.')).toBeInTheDocument();
    });

    it('shows recovery actions', () => {
      const error = new AdminError(
        'Network error',
        ErrorType.NETWORK,
        0,
        'NETWORK_ERROR'
      );

      render(
        <ErrorDisplay
          error={error}
          variant="banner"
        />
      );

      expect(screen.getByText('What you can do:')).toBeInTheDocument();
      expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
      expect(screen.getByText('Try refreshing the page')).toBeInTheDocument();
    });

    it('handles retry button click', async () => {
      const user = userEvent.setup();
      const error = new AdminError(
        'Network error',
        ErrorType.NETWORK,
        0,
        'NETWORK_ERROR',
        undefined,
        true
      );

      render(
        <ErrorDisplay
          error={error}
          onRetry={mockOnRetry}
          canRetry={true}
          retryCount={1}
          maxRetries={3}
          variant="banner"
        />
      );

      const retryButton = screen.getByText('Retry (2 left)');
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('handles dismiss button click', async () => {
      const user = userEvent.setup();
      const error = new AdminError(
        'Some error',
        ErrorType.UNKNOWN,
        500
      );

      render(
        <ErrorDisplay
          error={error}
          onDismiss={mockOnDismiss}
          variant="banner"
        />
      );

      const dismissButton = screen.getByRole('button');
      await user.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('shows retrying state', () => {
      const error = new AdminError(
        'Network error',
        ErrorType.NETWORK,
        0,
        'NETWORK_ERROR',
        undefined,
        true
      );

      render(
        <ErrorDisplay
          error={error}
          onRetry={mockOnRetry}
          canRetry={true}
          isRetrying={true}
          variant="banner"
        />
      );

      expect(screen.getByText('Retrying...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retrying/i })).toBeDisabled();
    });

    it('disables retry when no retries left', () => {
      const error = new AdminError(
        'Network error',
        ErrorType.NETWORK,
        0,
        'NETWORK_ERROR',
        undefined,
        true
      );

      render(
        <ErrorDisplay
          error={error}
          onRetry={mockOnRetry}
          canRetry={false}
          retryCount={3}
          maxRetries={3}
          variant="banner"
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeDisabled();
    });
  });

  describe('Card variant', () => {
    it('renders card variant correctly', () => {
      const error = new AdminError(
        'Something went wrong',
        ErrorType.UNKNOWN,
        500
      );

      render(
        <ErrorDisplay
          error={error}
          variant="card"
        />
      );

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });

    it('shows centered layout for card variant', () => {
      const error = new AdminError(
        'Error message',
        ErrorType.UNKNOWN,
        500
      );

      render(
        <ErrorDisplay
          error={error}
          variant="card"
        />
      );

      const container = screen.getByText('Something Went Wrong').closest('div');
      expect(container).toHaveClass('text-center');
    });
  });

  describe('Inline variant', () => {
    it('renders inline variant correctly', () => {
      const error = new AdminError(
        'Inline error message',
        ErrorType.VALIDATION,
        400
      );

      render(
        <ErrorDisplay
          error={error}
          variant="inline"
        />
      );

      expect(screen.getByText('Inline error message')).toBeInTheDocument();
    });

    it('shows compact retry button for inline variant', () => {
      const error = new AdminError(
        'Error',
        ErrorType.NETWORK,
        0,
        'NETWORK_ERROR',
        undefined,
        true
      );

      render(
        <ErrorDisplay
          error={error}
          onRetry={mockOnRetry}
          canRetry={true}
          variant="inline"
        />
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Development details', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('shows error details in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      const error = new AdminError(
        'Test error',
        ErrorType.SERVER,
        500,
        'TEST_ERROR'
      );
      error.stack = 'Error stack trace';

      render(
        <ErrorDisplay
          error={error}
          showDetails={true}
          variant="banner"
        />
      );

      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
      expect(screen.getByText('Type: SERVER')).toBeInTheDocument();
      expect(screen.getByText('Status: 500')).toBeInTheDocument();
      expect(screen.getByText('Code: TEST_ERROR')).toBeInTheDocument();
    });

    it('hides error details in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      const error = new AdminError(
        'Test error',
        ErrorType.SERVER,
        500,
        'TEST_ERROR'
      );

      render(
        <ErrorDisplay
          error={error}
          showDetails={true}
          variant="banner"
        />
      );

      expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();
    });
  });

  describe('Color themes', () => {
    it('applies correct color classes for different error types', () => {
      const networkError = new AdminError('Network error', ErrorType.NETWORK, 0);
      const { rerender } = render(<ErrorDisplay error={networkError} variant="banner" />);
      
      let container = screen.getByText('Connection Problem').closest('div');
      expect(container).toHaveClass('bg-blue-50', 'border-blue-200');

      const authError = new AdminError('Auth error', ErrorType.AUTHENTICATION, 401);
      rerender(<ErrorDisplay error={authError} variant="banner" />);
      
      container = screen.getByText('Authentication Required').closest('div');
      expect(container).toHaveClass('bg-yellow-50', 'border-yellow-200');

      const serverError = new AdminError('Server error', ErrorType.SERVER, 500);
      rerender(<ErrorDisplay error={serverError} variant="banner" />);
      
      container = screen.getByText('Server Error').closest('div');
      expect(container).toHaveClass('bg-red-50', 'border-red-200');
    });
  });
});

describe('SuccessDisplay Component', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders success message correctly', () => {
    render(
      <SuccessDisplay
        message="Operation completed successfully"
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });

  it('handles dismiss button click', async () => {
    const user = userEvent.setup();
    
    render(
      <SuccessDisplay
        message="Success message"
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByRole('button');
    await user.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders inline variant correctly', () => {
    render(
      <SuccessDisplay
        message="Inline success"
        variant="inline"
      />
    );

    expect(screen.getByText('Inline success')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies correct styling', () => {
    render(
      <SuccessDisplay
        message="Success message"
        variant="banner"
      />
    );

    const container = screen.getByText('Success message').closest('div');
    expect(container).toHaveClass('bg-green-50', 'border-green-200');
  });
});