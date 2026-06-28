import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AssumptionsPanel from '../AssumptionsPanel';
import { Assumptions } from '@/types';

describe('AssumptionsPanel', () => {
  const mockAssumptions: Assumptions = {
    investmentReturn: 0.06,
    inflationRate: 0.04,
    retirementYears: 20,
  };

  const mockAssumptionsWithOverrides: Assumptions = {
    investmentReturn: 0.06,
    inflationRate: 0.04,
    retirementYears: 20,
    countryInflation: {
      Germany: 0.06,
      India: 0.03,
    },
  };

  const mockOnRefresh = jest.fn();
  const mockOnAssumptionsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default country inflation rates if undefined', () => {
    render(
      <AssumptionsPanel
        assumptions={mockAssumptions}
        onRefresh={mockOnRefresh}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    expect(screen.getByText('Inflation Benchmarks')).toBeInTheDocument();
    
    const germanyInput = screen.getByTestId('input-inflation-germany') as HTMLInputElement;
    const indiaInput = screen.getByTestId('input-inflation-india') as HTMLInputElement;
    
    expect(germanyInput).toBeInTheDocument();
    expect(germanyInput.value).toBe('5'); // Default is 0.05 (5%)
    
    expect(indiaInput).toBeInTheDocument();
    expect(indiaInput.value).toBe('4'); // Default is 0.04 (4%)
  });

  it('renders with overridden country inflation rates if provided', () => {
    render(
      <AssumptionsPanel
        assumptions={mockAssumptionsWithOverrides}
        onRefresh={mockOnRefresh}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const germanyInput = screen.getByTestId('input-inflation-germany') as HTMLInputElement;
    const indiaInput = screen.getByTestId('input-inflation-india') as HTMLInputElement;
    
    expect(germanyInput.value).toBe('6');
    expect(indiaInput.value).toBe('3');
  });

  it('calls onAssumptionsChange when Germany rate changes', () => {
    render(
      <AssumptionsPanel
        assumptions={mockAssumptions}
        onRefresh={mockOnRefresh}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const germanyInput = screen.getByTestId('input-inflation-germany');
    fireEvent.change(germanyInput, { target: { value: '4.5' } });

    expect(mockOnAssumptionsChange).toHaveBeenCalledWith({
      ...mockAssumptions,
      countryInflation: {
        Germany: 0.045,
        India: 0.04, // Default India remains unchanged
      },
    });
  });

  it('calls onAssumptionsChange when India rate changes', () => {
    render(
      <AssumptionsPanel
        assumptions={mockAssumptionsWithOverrides}
        onRefresh={mockOnRefresh}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const indiaInput = screen.getByTestId('input-inflation-india');
    fireEvent.change(indiaInput, { target: { value: '4.2' } });

    expect(mockOnAssumptionsChange).toHaveBeenCalledWith({
      ...mockAssumptionsWithOverrides,
      countryInflation: {
        Germany: 0.06, // Overridden Germany remains unchanged
        India: 0.042,
      },
    });
  });

  it('handles invalid or empty inputs by passing 0', () => {
    render(
      <AssumptionsPanel
        assumptions={mockAssumptions}
        onRefresh={mockOnRefresh}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const germanyInput = screen.getByTestId('input-inflation-germany');
    fireEvent.change(germanyInput, { target: { value: '' } });

    expect(mockOnAssumptionsChange).toHaveBeenCalledWith({
      ...mockAssumptions,
      countryInflation: {
        Germany: 0,
        India: 0.04,
      },
    });
  });

  it('calls onRefresh when refresh button is clicked and handles loading state', async () => {
    jest.useFakeTimers();
    render(
      <AssumptionsPanel
        assumptions={mockAssumptions}
        onRefresh={mockOnRefresh}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const refreshButton = screen.getByTestId('refresh-data-button');
    expect(refreshButton).toBeInTheDocument();
    
    fireEvent.click(refreshButton);
    expect(screen.getByText('Refreshing…')).toBeInTheDocument();
    
    // Fast-forward timer by 1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });
    
    await waitFor(() => {
      expect(screen.getByText('↻ Refresh Data')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });
});
