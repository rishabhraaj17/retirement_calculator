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
    countryInvestmentReturn: {
      Germany: 0.07,
      India: 0.09,
    }
  };

  const mockOnRefresh = jest.fn();
  const mockOnAssumptionsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default country inflation and return rates if undefined', () => {
    render(
      <AssumptionsPanel
        assumptions={mockAssumptions}
        onRefresh={mockOnRefresh}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    expect(screen.getByText('Country Benchmarks')).toBeInTheDocument();
    
    const germanyInf = screen.getByTestId('input-inflation-germany') as HTMLInputElement;
    const germanyRet = screen.getByTestId('input-return-germany') as HTMLInputElement;
    const indiaInf = screen.getByTestId('input-inflation-india') as HTMLInputElement;
    const indiaRet = screen.getByTestId('input-return-india') as HTMLInputElement;
    
    expect(germanyInf.value).toBe('5'); // Default is 5%
    expect(germanyRet.value).toBe('6'); // Default is 6%
    expect(indiaInf.value).toBe('4'); // Default is 4%
    expect(indiaRet.value).toBe('8'); // Default is 8%
  });

  it('renders with overridden country inflation and return rates if provided', () => {
    render(
      <AssumptionsPanel
        assumptions={mockAssumptionsWithOverrides}
        onRefresh={mockOnRefresh}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const germanyInf = screen.getByTestId('input-inflation-germany') as HTMLInputElement;
    const germanyRet = screen.getByTestId('input-return-germany') as HTMLInputElement;
    
    expect(germanyInf.value).toBe('6');
    expect(germanyRet.value).toBe('7');
  });

  it('calls onAssumptionsChange when Germany inflation rate changes', () => {
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
        India: 0.04,
      },
    });
  });

  it('calls onAssumptionsChange when Germany investment return changes', () => {
    render(
      <AssumptionsPanel
        assumptions={mockAssumptions}
        onRefresh={mockOnRefresh}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const germanyInput = screen.getByTestId('input-return-germany');
    fireEvent.change(germanyInput, { target: { value: '7.5' } });

    expect(mockOnAssumptionsChange).toHaveBeenCalledWith({
      ...mockAssumptions,
      countryInvestmentReturn: {
        Germany: 0.075,
        India: 0.08,
      },
    });
  });

  it('calls onAssumptionsChange when India inflation rate changes', () => {
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
        Germany: 0.06,
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
