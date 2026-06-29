import { render, screen, fireEvent } from '@testing-library/react';
import InputForm from '../InputForm';
import { UserInputs, Assumptions } from '@/types';

describe('InputForm', () => {
  const mockUserInputs: UserInputs = {
    currentAge: 35,
    retirementAge: 65,
    currentSavings: 50000,
    monthlyContribution: 1000,
  };

  const mockAssumptions: Assumptions = {
    investmentReturn: 0.06,
    inflationRate: 0.025,
    retirementYears: 20,
  };

  const mockOnUserInputsChange = jest.fn();
  const mockOnAssumptionsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the input form with all fields', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    expect(screen.getByTestId('input-form')).toBeInTheDocument();
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.getByText('Financial Inputs')).toBeInTheDocument();
    expect(screen.getByText('Assumptions')).toBeInTheDocument();
  });

  it('renders current age input with correct value', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const currentAgeInput = screen.getByTestId('input-current-age') as HTMLInputElement;
    expect(currentAgeInput).toBeInTheDocument();
    expect(currentAgeInput.value).toBe('35');
  });

  it('calls onUserInputsChange when current age changes', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const currentAgeInput = screen.getByTestId('input-current-age');
    fireEvent.change(currentAgeInput, { target: { value: '40' } });

    expect(mockOnUserInputsChange).toHaveBeenCalledWith({
      ...mockUserInputs,
      currentAge: 40,
    });
  });

  it('calls onUserInputsChange when monthly contribution changes', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const contributionInput = screen.getByTestId('input-monthly-contribution');
    fireEvent.change(contributionInput, { target: { value: '1500' } });

    expect(mockOnUserInputsChange).toHaveBeenCalledWith({
      ...mockUserInputs,
      monthlyContribution: 1500,
    });
  });

  it('renders base monthly expense input with default value when not provided', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const expenseInput = screen.getByTestId('input-base-monthly-expense') as HTMLInputElement;
    expect(expenseInput).toBeInTheDocument();
    expect(expenseInput.value).toBe('3000');
  });

  it('calls onUserInputsChange and adjusts others residually when base monthly expense changes', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const expenseInput = screen.getByTestId('input-base-monthly-expense');
    fireEvent.change(expenseInput, { target: { value: '3500' } });

    // baseRent defaults to 1050, baseGroceries to 540, baseHealthcare to 350. Residual Others = 3500 - 1050 - 540 - 350 = 1560
    expect(mockOnUserInputsChange).toHaveBeenCalledWith({
      ...mockUserInputs,
      baseMonthlyExpense: 3500,
      baseOthers: 1560,
    });
  });

  it('toggles collapsible category details panel and fires category changes', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    expect(screen.queryByTestId('input-base-rent')).not.toBeInTheDocument();

    const toggleBtn = screen.getByText('▶ Show Expense Details');
    fireEvent.click(toggleBtn);

    expect(screen.getByText('▼ Hide Expense Details')).toBeInTheDocument();
    const rentInput = screen.getByTestId('input-base-rent');
    expect(rentInput).toBeInTheDocument();

    fireEvent.change(rentInput, { target: { value: '1200' } });

    // rent: 1200, groceries defaults to 540, healthcare to 350, others to 1060. Total sum = 3150
    expect(mockOnUserInputsChange).toHaveBeenCalledWith({
      ...mockUserInputs,
      baseRent: 1200,
      baseMonthlyExpense: 3150,
    });
  });

  it('renders range sliders for core inputs', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    expect(screen.getByTestId('input-current-age-slider')).toBeInTheDocument();
    expect(screen.getByTestId('input-retirement-age-slider')).toBeInTheDocument();
    expect(screen.getByTestId('input-current-savings-slider')).toBeInTheDocument();
    expect(screen.getByTestId('input-monthly-contribution-slider')).toBeInTheDocument();
    expect(screen.getByTestId('input-base-monthly-expense-slider')).toBeInTheDocument();
    expect(screen.getByTestId('input-retirement-years-slider')).toBeInTheDocument();
    
    // Removed global sliders
    expect(screen.queryByTestId('input-investment-return-slider')).not.toBeInTheDocument();
    expect(screen.queryByTestId('input-inflation-rate-slider')).not.toBeInTheDocument();
  });
});