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
    expect(screen.getByText('Personal Details & Financial Inputs')).toBeInTheDocument();
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

  it('renders retirement age input with correct value', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const retirementAgeInput = screen.getByTestId('input-retirement-age') as HTMLInputElement;
    expect(retirementAgeInput).toBeInTheDocument();
    expect(retirementAgeInput.value).toBe('65');
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

  it('calls onUserInputsChange when retirement age changes', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const retirementAgeInput = screen.getByTestId('input-retirement-age');
    fireEvent.change(retirementAgeInput, { target: { value: '67' } });

    expect(mockOnUserInputsChange).toHaveBeenCalledWith({
      ...mockUserInputs,
      retirementAge: 67,
    });
  });

  it('calls onUserInputsChange when current savings changes', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const savingsInput = screen.getByTestId('input-current-savings');
    fireEvent.change(savingsInput, { target: { value: '75000' } });

    expect(mockOnUserInputsChange).toHaveBeenCalledWith({
      ...mockUserInputs,
      currentSavings: 75000,
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

  it('calls onAssumptionsChange when investment return changes', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const returnInput = screen.getByTestId('input-investment-return');
    expect(returnInput).toBeInTheDocument();

    // Investment return is displayed as percentage (6 instead of 0.06)
    expect((returnInput as HTMLInputElement).value).toBe('6');

    fireEvent.change(returnInput, { target: { value: '7' } });

    expect(mockOnAssumptionsChange).toHaveBeenCalledWith({
      ...mockAssumptions,
      investmentReturn: 0.07,
    });
  });

  it('calls onAssumptionsChange when inflation rate changes', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const inflationInput = screen.getByTestId('input-inflation-rate');
    // Inflation rate is displayed as percentage (2.5 instead of 0.025)
    expect((inflationInput as HTMLInputElement).value).toBe('2.5');

    fireEvent.change(inflationInput, { target: { value: '3' } });

    expect(mockOnAssumptionsChange).toHaveBeenCalledWith({
      ...mockAssumptions,
      inflationRate: 0.03,
    });
  });

  it('shows default investment return hint', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    expect(screen.getByText('Default: 6%')).toBeInTheDocument();
  });

  it('shows inflation rate hint about data sources', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    expect(screen.getByText('Fetched from Eurostat/RBI or manual input')).toBeInTheDocument();
  });

  it('renders range sliders for all inputs', () => {
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
    expect(screen.getByTestId('input-investment-return-slider')).toBeInTheDocument();
    expect(screen.getByTestId('input-inflation-rate-slider')).toBeInTheDocument();
    expect(screen.getByTestId('input-retirement-years-slider')).toBeInTheDocument();
  });

  it('calls onUserInputsChange when a slider is adjusted', () => {
    render(
      <InputForm
        userInputs={mockUserInputs}
        assumptions={mockAssumptions}
        onUserInputsChange={mockOnUserInputsChange}
        onAssumptionsChange={mockOnAssumptionsChange}
      />
    );

    const currentAgeSlider = screen.getByTestId('input-current-age-slider');
    fireEvent.change(currentAgeSlider, { target: { value: '40' } });

    expect(mockOnUserInputsChange).toHaveBeenCalledWith({
      ...mockUserInputs,
      currentAge: 40,
    });
  });
});