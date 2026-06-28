import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComparisonDashboard from '../ComparisonDashboard';
import { CalculationResult } from '@/types';

// Mock Recharts to prevent canvas/ResizeObserver errors in JSDOM environment
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children, data }: any) => (
      <svg data-testid="bar-chart" data-data={JSON.stringify(data)}>
        {children}
      </svg>
    ),
    Bar: ({ dataKey, children }: any) => <g data-testid="bar-component" data-key={dataKey}>{children}</g>,
    Cell: ({ fill }: any) => <g data-testid="cell-component" data-fill={fill} />,
    XAxis: ({ dataKey }: any) => <g data-testid="xaxis-component" data-key={dataKey} />,
    YAxis: () => <g data-testid="yaxis-component" />,
    CartesianGrid: () => <g data-testid="cartesiangrid-component" />,
    Tooltip: () => <g data-testid="tooltip-component" />,
    Legend: () => <g data-testid="legend-component" />,
  };
});

describe('ComparisonDashboard', () => {
  const mockResults: CalculationResult[] = [
    {
      city: {
        id: 'munich',
        name: 'Munich',
        country: 'Germany',
        costOfLivingIndex: 100,
        rentIndex: 88,
        groceriesIndex: 105,
        healthcareCostMonthly: 350,
        taxRate: 0.15,
      },
      requiredFund: 1200000,
      projectedFund: 800000,
      fundingGap: 400000,
      yearsToRetirement: 35,
      totalMonthlyNeed: 3000,
      breakdown: {
        monthlyExpenses: 3000,
        housing: 1050,
        groceries: 540,
        healthcare: 350,
        other: 1060,
      },
      requiredSip: 350,
      requiredLumpSum: 52000,
      drawdownTimeline: [],
    },
    {
      city: {
        id: 'delhi-ncr',
        name: 'Delhi NCR',
        country: 'India',
        costOfLivingIndex: 25,
        rentIndex: 20,
        groceriesIndex: 22,
        healthcareCostMonthly: 150,
        taxRate: 0.10,
      },
      requiredFund: 400000,
      projectedFund: 450000,
      fundingGap: 0,
      yearsToRetirement: 35,
      totalMonthlyNeed: 1000,
      breakdown: {
        monthlyExpenses: 1000,
        housing: 300,
        groceries: 150,
        healthcare: 150,
        other: 400,
      },
      requiredSip: 0,
      requiredLumpSum: 0,
      drawdownTimeline: [],
    },
  ];

  it('renders select cities prompt when results are empty', () => {
    render(<ComparisonDashboard results={[]} />);
    expect(screen.getByTestId('comparison-dashboard-empty')).toBeInTheDocument();
    expect(screen.getByText(/Select cities to begin/i)).toBeInTheDocument();
  });

  it('renders comparison dashboard grid, charts, and table with results', () => {
    render(<ComparisonDashboard results={mockResults} />);
    expect(screen.getByTestId('comparison-dashboard')).toBeInTheDocument();

    // Headers
    expect(screen.getByText('2-City Comparison')).toBeInTheDocument();
    expect(screen.getAllByText('Munich')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Delhi NCR')[0]).toBeInTheDocument();

    // Table rows check
    expect(screen.getByText('Required Add. SIP')).toBeInTheDocument();
    expect(screen.getByText('Lump Sum Needed')).toBeInTheDocument();

    // Formatting check (e.g. €350 formatted as currency)
    expect(screen.getAllByText('€350')[0]).toBeInTheDocument();
    expect(screen.getAllByText('€52,000')[0]).toBeInTheDocument();
  });

  it('shows savings insight when comparing multiple cities', () => {
    render(<ComparisonDashboard results={mockResults} />);
    expect(screen.getByText(/reduces your required fund by/i)).toBeInTheDocument();
    // Saving = 1,200,000 - 400,000 = 800,000
    expect(screen.getAllByText('€800,000')[0]).toBeInTheDocument();
  });

  it('renders input elements for Monthly Need and calls onUserInputsChange when value changes', () => {
    const mockUserInputs = {
      currentAge: 30,
      retirementAge: 65,
      currentSavings: 50000,
      monthlyContribution: 500,
      cityExpenseOverrides: {},
    };
    const mockOnUserInputsChange = jest.fn();

    render(
      <ComparisonDashboard
        results={mockResults}
        userInputs={mockUserInputs}
        onUserInputsChange={mockOnUserInputsChange}
      />
    );

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2); // One for Munich (3000), one for Delhi NCR (1000)
    expect(inputs[0]).toHaveValue(3000);
    expect(inputs[1]).toHaveValue(1000);

    // Simulate change on Munich input
    fireEvent.change(inputs[0], { target: { value: '3500' } });

    expect(mockOnUserInputsChange).toHaveBeenCalledWith({
      ...mockUserInputs,
      cityExpenseOverrides: {
        munich: 3500,
      },
    });
  });
});
