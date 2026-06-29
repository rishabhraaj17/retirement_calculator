import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import Home from '../page';

// Mock Recharts to avoid canvas / ResizeObserver errors in test environments
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    PieChart: ({ children }: any) => <svg data-testid="pie-chart">{children}</svg>,
    Pie: ({ data, dataKey, nameKey, children }: any) => (
      <g data-testid="pie-component" data-data={JSON.stringify(data)} data-key={dataKey} data-name-key={nameKey}>
        {children}
      </g>
    ),
    Cell: ({ fill }: any) => <g data-testid="cell-component" data-fill={fill} />,
    AreaChart: ({ children, data }: any) => (
      <svg data-testid="area-chart-component" data-data={JSON.stringify(data)}>
        {children}
      </svg>
    ),
    Area: ({ dataKey }: any) => <g data-testid="area-component" data-key={dataKey} />,
    XAxis: ({ dataKey }: any) => <g data-testid="xaxis-component" data-key={dataKey} />,
    YAxis: () => <g data-testid="yaxis-component" />,
    CartesianGrid: () => <g data-testid="cartesiangrid-component" />,
    Tooltip: () => <g data-testid="tooltip-component" />,
    Legend: () => <g data-testid="legend-component" />,
    BarChart: ({ children, data }: any) => (
      <svg data-testid="bar-chart-component" data-data={JSON.stringify(data)}>
        {children}
      </svg>
    ),
    Bar: ({ dataKey }: any) => <g data-testid="bar-component" data-key={dataKey} />,
  };
});

// Mock fetch globally
global.fetch = jest.fn();

const mockCitiesList = [
  { id: 'munich', name: 'Munich', country: 'Germany', costOfLivingIndex: 100, rentIndex: 88, groceriesIndex: 105, healthcareCostMonthly: 350, taxRate: 0.15 },
  { id: 'delhi-ncr', name: 'Delhi NCR', country: 'India', costOfLivingIndex: 25, rentIndex: 20, groceriesIndex: 22, healthcareCostMonthly: 150, taxRate: 0.10 },
];

describe('Home Orchestrator Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockCitiesList,
    });
  });

  it('renders side panels and the empty state initially', async () => {
    render(<Home />);

    // Wait for cities load
    await waitFor(() => {
      expect(screen.getByTestId('city-selector')).toBeInTheDocument();
    });

    expect(screen.getByTestId('input-form')).toBeInTheDocument();
    expect(screen.getByTestId('assumptions-panel')).toBeInTheDocument();

    // Check for empty state comparison dashboard
    expect(screen.getByTestId('comparison-dashboard-empty')).toBeInTheDocument();
    expect(screen.queryByText('Single City Focus')).not.toBeInTheDocument();
  });

  it('handles selecting 1 city, defaulting to single city focus', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByTestId('city-selector')).toBeInTheDocument();
    });

    // Select Munich
    const munichBtn = screen.getByTestId('checkbox-munich');
    fireEvent.click(munichBtn);

    // Switcher tabs should appear
    expect(screen.getByRole('button', { name: 'Single City Focus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compare Cities' })).toBeInTheDocument();

    // Should default to Single City Focus dashboard
    expect(screen.getByTestId('single-city-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Munich Detailed Analysis')).toBeInTheDocument();
    expect(screen.queryByTestId('comparison-dashboard')).not.toBeInTheDocument();

    // Switch to Comparison view
    fireEvent.click(screen.getByRole('button', { name: 'Compare Cities' }));
    expect(screen.getByTestId('comparison-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('single-city-dashboard')).not.toBeInTheDocument();
  });

  it('handles selecting 2 cities, showing deep dive selector in single focus', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByTestId('city-selector')).toBeInTheDocument();
    });

    // Select Munich
    fireEvent.click(screen.getByTestId('checkbox-munich'));
    // Select Delhi NCR
    fireEvent.click(screen.getByTestId('checkbox-delhi-ncr'));

    // Should render switcher
    expect(screen.getByRole('button', { name: 'Single City Focus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compare Cities' })).toBeInTheDocument();

    // Under single focus, the selector dropdown should be visible
    const select = screen.getByTestId('city-deep-dive-select');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('Munich');

    // Currently showing Munich dashboard
    expect(screen.getByText('Munich Detailed Analysis')).toBeInTheDocument();

    // Switch deep dive city to Delhi NCR
    fireEvent.change(select, { target: { value: 'Delhi NCR' } });
    expect(screen.getByText('Delhi NCR Detailed Analysis')).toBeInTheDocument();

    // Switch to Compare Cities tab
    fireEvent.click(screen.getByRole('button', { name: 'Compare Cities' }));
    expect(screen.getByTestId('comparison-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('city-deep-dive-select')).not.toBeInTheDocument();
  });

  it('propagates custom expense edits in SingleCityDashboard and updates calculator state', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByTestId('city-selector')).toBeInTheDocument();
    });

    // Select Munich
    fireEvent.click(screen.getByTestId('checkbox-munich'));

    // Verify it shows Single City Focus and Munich Detailed Analysis
    expect(screen.getByText('Munich Detailed Analysis')).toBeInTheDocument();

    // Find the input element (spinbutton) inside single city dashboard
    const dashboard = screen.getByTestId('single-city-dashboard');
    const input = within(dashboard).getByTestId('total-monthly-need-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(2650);

    const reqCard = screen.getByTestId('hero-required-corpus');
    expect(reqCard).toBeInTheDocument();
    const initialText = reqCard.textContent;

    // Change value
    fireEvent.change(input, { target: { value: '4000' } });

    // Verify input value updated
    expect(input).toHaveValue(4000);

    // Verify calculator state updated
    await waitFor(() => {
      expect(reqCard.textContent).not.toBe(initialText);
    });
  });

  it('propagates custom expense edits in ComparisonDashboard and updates calculator state', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByTestId('city-selector')).toBeInTheDocument();
    });

    // Select Munich and Delhi NCR
    fireEvent.click(screen.getByTestId('checkbox-munich'));
    fireEvent.click(screen.getByTestId('checkbox-delhi-ncr'));

    // Switch to Comparison tab
    fireEvent.click(screen.getByRole('button', { name: 'Compare Cities' }));

    // Verify it renders Comparison Dashboard
    expect(screen.getByTestId('comparison-dashboard')).toBeInTheDocument();

    // Find the row for Munich and Delhi NCR
    const dashboard = screen.getByTestId('comparison-dashboard');
    const munichRow = within(dashboard).getAllByText('Munich').map(el => el.closest('tr')).find(Boolean);
    const delhiRow = within(dashboard).getAllByText('Delhi NCR').map(el => el.closest('tr')).find(Boolean);
    
    expect(munichRow).toBeDefined();
    expect(delhiRow).toBeDefined();

    const munichInput = within(munichRow!).getByRole('spinbutton');
    const delhiInput = within(delhiRow!).getByRole('spinbutton');

    expect(munichInput).toHaveValue(2650); // Munich input
    expect(delhiInput).toHaveValue(704);  // Delhi NCR input

    const initialRowText = delhiRow!.textContent;

    // Change value
    fireEvent.change(delhiInput, { target: { value: '1000' } });

    // The input value should be updated
    expect(delhiInput).toHaveValue(1000);

    // And the row text should change due to recalculations
    await waitFor(() => {
      expect(delhiRow!.textContent).not.toBe(initialRowText);
    });
  });
});

