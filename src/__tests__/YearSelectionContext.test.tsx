import React from 'react';
import { render, screen } from '@testing-library/react';
import { YearSelectionProvider, useYearSelection } from '../context/YearSelectionContext';

// Test component that uses the context
const TestConsumer = () => {
  const { selectedYears, availableYears } = useYearSelection();
  return (
    <div>
      <div data-testid="selected-years">{selectedYears.join(',')}</div>
      <div data-testid="available-years">{availableYears.join(',')}</div>
    </div>
  );
};

describe('YearSelectionContext', () => {
  it('should provide default values when rendered with no children', () => {
    // This should not throw
    render(<YearSelectionProvider availableYears={[]}>{null}</YearSelectionProvider>);
  });

  it('should initialize with available years', () => {
    render(
      <YearSelectionProvider availableYears={['2022', '2023', '2024']}>
        <TestConsumer />
      </YearSelectionProvider>
    );

    expect(screen.getByTestId('selected-years').textContent).toBe('2022,2023,2024');
    expect(screen.getByTestId('available-years').textContent).toBe('2022,2023,2024');
  });

  it('should handle empty available years array', () => {
    render(
      <YearSelectionProvider availableYears={[]}>
        <TestConsumer />
      </YearSelectionProvider>
    );

    expect(screen.getByTestId('selected-years').textContent).toBe('');
    expect(screen.getByTestId('available-years').textContent).toBe('');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useYearSelection must be used within a YearSelectionProvider');

    // Restore console.error
    console.error = originalError;
  });
});