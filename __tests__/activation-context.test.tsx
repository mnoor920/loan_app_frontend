import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ActivationProvider, useActivation } from '../contexts/ActivationContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test component to interact with context
const TestComponent = () => {
  const { 
    data, 
    updateStepData, 
    getStepData, 
    clearData, 
    currentStep, 
    setCurrentStep,
    isLoading,
    error,
    clearError
  } = useActivation();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="current-step">{currentStep}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="step1-data">{JSON.stringify(getStepData(1))}</div>
      
      <button 
        data-testid="update-step1" 
        onClick={() => updateStepData(1, { fullName: 'John Doe', gender: 'male' })}
      >
        Update Step 1
      </button>
      
      <button 
        data-testid="set-step2" 
        onClick={() => setCurrentStep(2)}
      >
        Set Step 2
      </button>
      
      <button 
        data-testid="clear-data" 
        onClick={clearData}
      >
        Clear Data
      </button>
      
      <button 
        data-testid="clear-error" 
        onClick={clearError}
      >
        Clear Error
      </button>
    </div>
  );
};

describe('ActivationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('should provide initial context values', async () => {
    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('step1-data')).toHaveTextContent('undefined');
  });

  test('should update step data and save to localStorage', async () => {
    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    act(() => {
      screen.getByTestId('update-step1').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('step1-data')).toHaveTextContent('{"fullName":"John Doe","gender":"male"}');
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  test('should update current step', async () => {
    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    act(() => {
      screen.getByTestId('set-step2').click();
    });

    expect(screen.getByTestId('current-step')).toHaveTextContent('2');
  });

  test('should clear all data', async () => {
    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // First add some data
    act(() => {
      screen.getByTestId('update-step1').click();
      screen.getByTestId('set-step2').click();
    });

    expect(screen.getByTestId('current-step')).toHaveTextContent('2');

    // Then clear it
    act(() => {
      screen.getByTestId('clear-data').click();
    });

    expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    expect(screen.getByTestId('step1-data')).toHaveTextContent('undefined');
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  test('should restore data from localStorage', async () => {
    const storedData = {
      data: {
        step1: { fullName: 'Jane Doe', gender: 'female' }
      },
      currentStep: 3,
      timestamp: Date.now(),
      version: '1.0.0'
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('current-step')).toHaveTextContent('3');
    expect(screen.getByTestId('step1-data')).toHaveTextContent('{"fullName":"Jane Doe","gender":"female"}');
  });

  test('should handle expired data', async () => {
    const expiredData = {
      data: { step1: { fullName: 'Old Data' } },
      currentStep: 2,
      timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      version: '1.0.0'
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData));

    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should use default values, not expired data
    expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    expect(screen.getByTestId('step1-data')).toHaveTextContent('undefined');
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  test('should handle version mismatch', async () => {
    const oldVersionData = {
      data: { step1: { fullName: 'Old Version' } },
      currentStep: 2,
      timestamp: Date.now(),
      version: '0.9.0' // Old version
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(oldVersionData));

    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should use default values, not old version data
    expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    expect(screen.getByTestId('step1-data')).toHaveTextContent('undefined');
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  test('should handle corrupted localStorage data', async () => {
    localStorageMock.getItem.mockReturnValue('invalid json');

    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should show error and use default values
    expect(screen.getByTestId('error')).toHaveTextContent('Failed to load saved activation data. Starting fresh.');
    expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  test('should clear errors', async () => {
    localStorageMock.getItem.mockReturnValue('invalid json');

    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load saved activation data. Starting fresh.');
    });

    act(() => {
      screen.getByTestId('clear-error').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  test('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useActivation must be used within an ActivationProvider');

    consoleSpy.mockRestore();
  });
});