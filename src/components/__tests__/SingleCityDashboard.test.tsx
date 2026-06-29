import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import SingleCityDashboard from '../SingleCityDashboard';
import { CalculationResult, City } from '@/types';

// Mock Recharts to prevent canvas/ResizeObserver errors in JSDOM environment
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
  };
});

describe('SingleCityDashboard', () => {
  const mockCityGermany: City = {
    id: 'munich',
    name: 'Munich',
    country: 'Germany',
    costOfLivingIndex: 100,
    rentIndex: 88,
    groceriesIndex: 105,
    healthcareCostMonthly: 350,
    taxRate: 0.15,
  };

  const mockCityIndia: City = {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    costOfLivingIndex: 30,
    rentIndex: 35,
    groceriesIndex: 28,
    healthcareCostMonthly: 200,
    taxRate: 0.10,
  };

  const baseResult: Omit<CalculationResult, 'city'> = {
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
    drawdownTimeline: [
      { age: 30, phase: 'Accumulation', balance: 50000, netContributions: 50000 },
      { age: 65, phase: 'Accumulation', balance: 800000, netContributions: 470000 },
      { age: 66, phase: 'Retirement', balance: 750000, netContributions: 470000 },
      { age: 85, phase: 'Retirement', balance: 0, netContributions: 470000 },
    ],
  };

  it('renders correct header with name and country', () => {
    const result: CalculationResult = {
      ...baseResult,
      city: mockCityGermany,
    };

    render(<SingleCityDashboard result={result} />);

    expect(screen.getByText('Single City Focus')).toBeInTheDocument();
    expect(screen.getByText('🇩🇪 Germany')).toBeInTheDocument();
    expect(screen.getByText('Munich Detailed Analysis')).toBeInTheDocument();
  });

  it('renders hero cards with correct values when underfunded', () => {
    const result: CalculationResult = {
      ...baseResult,
      city: mockCityGermany,
    };

    render(<SingleCityDashboard result={result} />);

    // Check Hero Card: Required Corpus
    const reqCard = screen.getByTestId('hero-required-corpus');
    expect(reqCard).toBeInTheDocument();
    expect(within(reqCard).getByText('€1,200,000')).toBeInTheDocument();

    // Check Hero Card: Projected Savings
    const projCard = screen.getByTestId('hero-projected-savings');
    expect(projCard).toBeInTheDocument();
    expect(within(projCard).getByText('€800,000')).toBeInTheDocument();

    // Check Hero Card: Funding Gap
    const gapCard = screen.getByTestId('hero-funding-gap');
    expect(gapCard).toBeInTheDocument();
    expect(within(gapCard).getByText('€400,000')).toBeInTheDocument();
  });

  it('renders correct actionable SIP Goal card for underfunded scenario', () => {
    const result: CalculationResult = {
      ...baseResult,
      city: mockCityGermany,
    };

    render(<SingleCityDashboard result={result} />);

    const sipCard = screen.getByTestId('sip-goal-card');
    expect(sipCard).toBeInTheDocument();
    expect(within(sipCard).getByText('Actionable SIP Goal')).toBeInTheDocument();
    
    // Check key message containing gap, required SIP, and lump sum
    expect(within(sipCard).getByText(/To cover your gap of/)).toBeInTheDocument();
    expect(within(sipCard).getByText('€400,000')).toBeInTheDocument();
    expect(within(sipCard).getAllByText('€350/month')[0]).toBeInTheDocument();
    expect(within(sipCard).getByText('€52,000')).toBeInTheDocument();
  });

  it('renders congratulatory message on SIP Goal card when fully funded', () => {
    const result: CalculationResult = {
      ...baseResult,
      city: mockCityIndia,
      fundingGap: 0,
      requiredSip: 0,
      requiredLumpSum: 0,
    };

    render(<SingleCityDashboard result={result} />);

    const sipCard = screen.getByTestId('sip-goal-card');
    expect(sipCard).toBeInTheDocument();
    expect(screen.getByText('Retirement Plan Status')).toBeInTheDocument();
    expect(screen.getByText(/Congratulations! You are on track to meet your retirement goal/)).toBeInTheDocument();
    expect(screen.queryByText(/To cover your gap of/)).not.toBeInTheDocument();
  });

  it('renders Pie/Donut Chart with correct expense breakdown data', () => {
    const result: CalculationResult = {
      ...baseResult,
      city: mockCityGermany,
    };

    render(<SingleCityDashboard result={result} />);

    const donutContainer = screen.getByTestId('expenses-donut-chart');
    expect(donutContainer).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    
    const pie = screen.getByTestId('pie-component');
    expect(pie).toBeInTheDocument();
    expect(pie.getAttribute('data-key')).toBe('value');
    expect(pie.getAttribute('data-name-key')).toBe('name');

    const rawData = pie.getAttribute('data-data');
    expect(rawData).not.toBeNull();
    const data = JSON.parse(rawData!);
    expect(data).toHaveLength(4);
    
    expect(data[0]).toEqual({ key: 'rent', name: 'Rent/Housing', value: 1050, color: 'var(--de-color)' });
    expect(data[1]).toEqual({ key: 'groceries', name: 'Groceries', value: 540, color: 'var(--in-color)' });
    expect(data[2]).toEqual({ key: 'healthcare', name: 'Healthcare', value: 350, color: 'var(--positive)' });
    expect(data[3]).toEqual({ key: 'others', name: 'Others', value: 1060, color: 'var(--accent)' });
  });

  it('renders Area Chart with correct drawdown timeline data', () => {
    const result: CalculationResult = {
      ...baseResult,
      city: mockCityGermany,
    };

    render(<SingleCityDashboard result={result} />);

    const areaContainer = screen.getByTestId('drawdown-area-chart');
    expect(areaContainer).toBeInTheDocument();

    const areaChart = screen.getByTestId('area-chart-component');
    expect(areaChart).toBeInTheDocument();

    const rawTimeline = areaChart.getAttribute('data-data');
    expect(rawTimeline).not.toBeNull();
    const timeline = JSON.parse(rawTimeline!);
    expect(timeline).toHaveLength(4);
    expect(timeline[0]).toEqual({ age: 30, phase: 'Accumulation', balance: 50000, netContributions: 50000 });
    expect(timeline[1]).toEqual({ age: 65, phase: 'Accumulation', balance: 800000, netContributions: 470000 });

    // Verify peak age calculation in the legend
    expect(screen.getByText('Peak: €800K at age 65')).toBeInTheDocument();
  });

  it('renders the editable input and triggers handleOverride on change', () => {
    const result: CalculationResult = {
      ...baseResult,
      city: mockCityGermany,
      totalMonthlyNeed: 3000,
    };
    const userInputs = {
      currentAge: 30,
      retirementAge: 65,
      currentSavings: 50000,
      monthlyContribution: 500,
      baseMonthlyExpense: 3000,
      cityExpenseOverrides: {},
      cityCategoryOverrides: {},
    };
    const onUserInputsChange = jest.fn();

    render(
      <SingleCityDashboard
        result={result}
        userInputs={userInputs}
        onUserInputsChange={onUserInputsChange}
      />
    );

    const input = screen.getByTestId('total-monthly-need-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(3000);

    fireEvent.change(input, { target: { value: '3500' } });

    expect(onUserInputsChange).toHaveBeenCalledWith({
      ...userInputs,
      cityExpenseOverrides: {
        munich: 3500,
      },
      cityCategoryOverrides: {},
    });
  });

  it('displays red badge (+X% vs average) and reset button when monthly need exceeds standard average', () => {
    const result: CalculationResult = {
      ...baseResult,
      city: mockCityGermany,
      totalMonthlyNeed: 3600, // standardAvg = 3000 (3000 * 100 / 100) -> +20%
    };
    const userInputs = {
      currentAge: 30,
      retirementAge: 65,
      currentSavings: 50000,
      monthlyContribution: 500,
      baseMonthlyExpense: 3000,
      cityExpenseOverrides: { munich: 3600 },
      cityCategoryOverrides: {},
    };
    const onUserInputsChange = jest.fn();

    render(
      <SingleCityDashboard
        result={result}
        userInputs={userInputs}
        onUserInputsChange={onUserInputsChange}
      />
    );

    const badge = screen.getByTestId('comparison-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('+20% vs average');
    expect(badge.style.color).toBe('var(--danger)');
    expect(badge.style.border).toBe('1px solid var(--danger)');

    const resetBtn = screen.getByRole('button', { name: 'Reset to Average' });
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);

    expect(onUserInputsChange).toHaveBeenCalledWith({
      ...userInputs,
      cityExpenseOverrides: {},
      cityCategoryOverrides: {},
    });
  });

  it('displays green badge (-Y% vs average) when monthly need is below standard average', () => {
    const result: CalculationResult = {
      ...baseResult,
      city: mockCityGermany,
      totalMonthlyNeed: 2400, // standardAvg = 3000 -> -20%
    };
    const userInputs = {
      currentAge: 30,
      retirementAge: 65,
      currentSavings: 50000,
      monthlyContribution: 500,
      baseMonthlyExpense: 3000,
      cityExpenseOverrides: { munich: 2400 },
    };
    const onUserInputsChange = jest.fn();

    render(
      <SingleCityDashboard
        result={result}
        userInputs={userInputs}
        onUserInputsChange={onUserInputsChange}
      />
    );

    const badge = screen.getByTestId('comparison-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('-20% vs average');
    expect(badge.style.color).toBe('var(--positive)');
    expect(badge.style.border).toBe('1px solid var(--positive)');
  });
});
