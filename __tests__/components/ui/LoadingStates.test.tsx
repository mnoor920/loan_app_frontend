import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  LoadingSpinner,
  SkeletonCard,
  SkeletonTable,
  SkeletonStats,
  LoadingOverlay,
  LoadingButton,
  PageLoading,
  InlineLoading,
  SkeletonList,
  SkeletonForm,
  ProgressIndicator,
  RefreshIndicator
} from '@/components/ui/LoadingStates';

describe('LoadingStates Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default size', () => {
      render(<LoadingSpinner />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('w-6', 'h-6');
    });

    it('renders with small size', () => {
      render(<LoadingSpinner size="sm" />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-4', 'h-4');
    });

    it('renders with large size', () => {
      render(<LoadingSpinner size="lg" />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('applies custom className', () => {
      render(<LoadingSpinner className="text-blue-500" />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('text-blue-500');
    });
  });

  describe('SkeletonCard', () => {
    it('renders without avatar by default', () => {
      render(<SkeletonCard />);
      const avatars = document.querySelectorAll('.w-12.h-12');
      expect(avatars).toHaveLength(0);
    });

    it('renders with avatar when specified', () => {
      render(<SkeletonCard showAvatar={true} />);
      const avatar = document.querySelector('.w-12.h-12');
      expect(avatar).toBeInTheDocument();
    });

    it('renders correct number of lines', () => {
      render(<SkeletonCard lines={5} />);
      const lines = document.querySelectorAll('.h-4.bg-gray-200');
      expect(lines).toHaveLength(5);
    });

    it('applies animation classes', () => {
      render(<SkeletonCard />);
      const container = document.querySelector('.animate-pulse');
      expect(container).toBeInTheDocument();
    });
  });

  describe('SkeletonTable', () => {
    it('renders with default rows and columns', () => {
      render(<SkeletonTable />);
      const headerCells = document.querySelectorAll('.flex.gap-4 > .flex-1');
      const rowCells = document.querySelectorAll('.space-y-3 .flex.gap-4 > .flex-1');
      
      expect(headerCells).toHaveLength(4); // Default columns
      expect(rowCells).toHaveLength(20); // 5 rows * 4 columns
    });

    it('renders with custom rows and columns', () => {
      render(<SkeletonTable rows={3} columns={6} />);
      const headerCells = document.querySelectorAll('.flex.gap-4 > .flex-1');
      const rowCells = document.querySelectorAll('.space-y-3 .flex.gap-4 > .flex-1');
      
      expect(headerCells).toHaveLength(6);
      expect(rowCells).toHaveLength(18); // 3 rows * 6 columns
    });
  });

  describe('SkeletonStats', () => {
    it('renders default number of stat cards', () => {
      render(<SkeletonStats />);
      const cards = document.querySelectorAll('.bg-white.dark\\:bg-gray-900');
      expect(cards).toHaveLength(4);
    });

    it('renders custom number of stat cards', () => {
      render(<SkeletonStats count={6} />);
      const cards = document.querySelectorAll('.bg-white.dark\\:bg-gray-900');
      expect(cards).toHaveLength(6);
    });

    it('applies grid layout classes', () => {
      render(<SkeletonStats />);
      const container = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
      expect(container).toBeInTheDocument();
    });
  });

  describe('LoadingOverlay', () => {
    it('renders children when not loading', () => {
      render(
        <LoadingOverlay isLoading={false}>
          <div>Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('shows overlay when loading', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows custom loading message', () => {
      render(
        <LoadingOverlay isLoading={true} message="Processing...">
          <div>Content</div>
        </LoadingOverlay>
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('applies overlay styling when loading', () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );
      
      const overlay = document.querySelector('.absolute.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('bg-white/80', 'backdrop-blur-sm');
    });
  });

  describe('LoadingButton', () => {
    const mockOnClick = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders children when not loading', () => {
      render(
        <LoadingButton onClick={mockOnClick}>
          Click me
        </LoadingButton>
      );
      
      expect(screen.getByText('Click me')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(
        <LoadingButton isLoading={true} onClick={mockOnClick}>
          Click me
        </LoadingButton>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    });

    it('shows custom loading text', () => {
      render(
        <LoadingButton isLoading={true} loadingText="Saving..." onClick={mockOnClick}>
          Save
        </LoadingButton>
      );
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(
        <LoadingButton isLoading={true} onClick={mockOnClick}>
          Click me
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('handles click when not loading', async () => {
      const user = userEvent.setup();
      
      render(
        <LoadingButton onClick={mockOnClick}>
          Click me
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('applies variant styling', () => {
      render(
        <LoadingButton variant="danger" onClick={mockOnClick}>
          Delete
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'hover:bg-red-700');
    });
  });

  describe('PageLoading', () => {
    it('renders with default message', () => {
      render(<PageLoading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<PageLoading message="Initializing..." />);
      expect(screen.getByText('Initializing...')).toBeInTheDocument();
    });

    it('applies full screen styling', () => {
      render(<PageLoading />);
      const container = document.querySelector('.flex.min-h-screen');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('items-center', 'justify-center');
    });
  });

  describe('InlineLoading', () => {
    it('renders with default message and size', () => {
      render(<InlineLoading />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<InlineLoading message="Fetching data..." />);
      expect(screen.getByText('Fetching data...')).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<InlineLoading size="sm" />);
      let spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-4', 'h-4');

      rerender(<InlineLoading size="lg" />);
      spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });
  });

  describe('SkeletonList', () => {
    it('renders default number of items', () => {
      render(<SkeletonList />);
      const items = document.querySelectorAll('.space-y-4 > div');
      expect(items).toHaveLength(5);
    });

    it('renders custom number of items', () => {
      render(<SkeletonList count={8} />);
      const items = document.querySelectorAll('.space-y-4 > div');
      expect(items).toHaveLength(8);
    });

    it('shows avatars when specified', () => {
      render(<SkeletonList showAvatar={true} />);
      const avatars = document.querySelectorAll('.w-12.h-12.rounded-full');
      expect(avatars).toHaveLength(5); // Default count
    });

    it('hides avatars when specified', () => {
      render(<SkeletonList showAvatar={false} />);
      const avatars = document.querySelectorAll('.w-12.h-12.rounded-full');
      expect(avatars).toHaveLength(0);
    });
  });

  describe('SkeletonForm', () => {
    it('renders default number of fields', () => {
      render(<SkeletonForm />);
      const fields = document.querySelectorAll('.space-y-6 > .space-y-2');
      expect(fields).toHaveLength(6);
    });

    it('renders custom number of fields', () => {
      render(<SkeletonForm fields={4} />);
      const fields = document.querySelectorAll('.space-y-6 > .space-y-2');
      expect(fields).toHaveLength(4);
    });

    it('renders form buttons', () => {
      render(<SkeletonForm />);
      const buttons = document.querySelectorAll('.flex.gap-3 > .h-10');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('ProgressIndicator', () => {
    it('renders progress bar with correct width', () => {
      render(<ProgressIndicator progress={75} />);
      const progressBar = document.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle('width: 75%');
    });

    it('displays progress percentage', () => {
      render(<ProgressIndicator progress={42} />);
      expect(screen.getByText('42%')).toBeInTheDocument();
    });

    it('shows custom message', () => {
      render(<ProgressIndicator progress={50} message="Uploading files..." />);
      expect(screen.getByText('Uploading files...')).toBeInTheDocument();
    });

    it('caps progress at 100%', () => {
      render(<ProgressIndicator progress={150} />);
      const progressBar = document.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle('width: 100%');
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('floors progress at 0%', () => {
      render(<ProgressIndicator progress={-10} />);
      const progressBar = document.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle('width: 0%');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('RefreshIndicator', () => {
    const mockOnRefresh = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders refresh button', () => {
      render(<RefreshIndicator isRefreshing={false} onRefresh={mockOnRefresh} />);
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('shows refreshing state', () => {
      render(<RefreshIndicator isRefreshing={true} onRefresh={mockOnRefresh} />);
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });

    it('handles refresh click', async () => {
      const user = userEvent.setup();
      
      render(<RefreshIndicator isRefreshing={false} onRefresh={mockOnRefresh} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('is disabled when refreshing', () => {
      render(<RefreshIndicator isRefreshing={true} onRefresh={mockOnRefresh} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('shows spinning icon when refreshing', () => {
      render(<RefreshIndicator isRefreshing={true} onRefresh={mockOnRefresh} />);
      
      const icon = document.querySelector('.animate-spin');
      expect(icon).toBeInTheDocument();
    });
  });
});