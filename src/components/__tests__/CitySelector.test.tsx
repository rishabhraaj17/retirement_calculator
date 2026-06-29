import { render, screen, fireEvent } from '@testing-library/react';
import CitySelector from '../CitySelector';
import { City } from '@/types';

describe('CitySelector', () => {
  const mockCities: City[] = [
    {
      id: 'munich',
      name: 'Munich',
      country: 'Germany',
      costOfLivingIndex: 100,
      rentIndex: 88,
      groceriesIndex: 105,
      healthcareCostMonthly: 350,
      taxRate: 0.15,
    },
    {
      id: 'delhi-ncr',
      name: 'Delhi NCR',
      country: 'India',
      costOfLivingIndex: 25,
      rentIndex: 20,
      groceriesIndex: 22,
      healthcareCostMonthly: 150,
      taxRate: 0.10,
    },
  ];

  const mockOnSelectionChange = jest.fn();
  const mockOnAddCity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cities grouped by country and displays CoL index', () => {
    render(
      <CitySelector
        cities={mockCities}
        selectedCities={[]}
        onSelectionChange={mockOnSelectionChange}
        onAddCity={mockOnAddCity}
      />
    );

    expect(screen.getByTestId('city-selector')).toBeInTheDocument();
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('India')).toBeInTheDocument();

    expect(screen.getByTestId('checkbox-munich')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-delhi-ncr')).toBeInTheDocument();
    expect(screen.getByText(/CoL 100/i)).toBeInTheDocument();
    expect(screen.getByText(/CoL 25/i)).toBeInTheDocument();
  });

  it('calls onSelectionChange when a city is selected', () => {
    render(
      <CitySelector
        cities={mockCities}
        selectedCities={[]}
        onSelectionChange={mockOnSelectionChange}
        onAddCity={mockOnAddCity}
      />
    );

    const checkbox = screen.getByTestId('checkbox-munich');
    fireEvent.click(checkbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['Munich']);
  });

  it('calls onSelectionChange when a city is deselected', () => {
    render(
      <CitySelector
        cities={mockCities}
        selectedCities={['Munich']}
        onSelectionChange={mockOnSelectionChange}
        onAddCity={mockOnAddCity}
      />
    );

    const checkbox = screen.getByTestId('checkbox-munich');
    fireEvent.click(checkbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('shows error state when error prop is provided', () => {
    render(
      <CitySelector
        cities={mockCities}
        selectedCities={[]}
        onSelectionChange={mockOnSelectionChange}
        onAddCity={mockOnAddCity}
        error="Error loading cities"
      />
    );

    expect(screen.getByTestId('city-selector-error')).toBeInTheDocument();
    expect(screen.getByText(/Error loading cities/i)).toBeInTheDocument();
  });

  it('handles adding custom cities through the form', () => {
    render(
      <CitySelector
        cities={mockCities}
        selectedCities={[]}
        onSelectionChange={mockOnSelectionChange}
        onAddCity={mockOnAddCity}
      />
    );

    expect(screen.queryByPlaceholderText('e.g. Frankfurt')).not.toBeInTheDocument();

    const toggleBtn = screen.getByText('▶ Add Custom City');
    fireEvent.click(toggleBtn);

    expect(screen.getByPlaceholderText('e.g. Frankfurt')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('e.g. Frankfurt'), { target: { value: 'Frankfurt' } });
    fireEvent.change(screen.getByLabelText(/CoL Index/i), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText(/Rent Index/i), { target: { value: '75' } });
    fireEvent.change(screen.getByLabelText(/Groceries Index/i), { target: { value: '95' } });
    fireEvent.change(screen.getByLabelText(/Tax Rate %/i), { target: { value: '18' } });
    fireEvent.change(screen.getByLabelText(/Monthly Healthcare/i), { target: { value: '380' } });

    const submitBtn = screen.getByRole('button', { name: 'Add Custom City' });
    fireEvent.click(submitBtn);

    expect(mockOnAddCity).toHaveBeenCalledWith({
      id: 'frankfurt',
      name: 'Frankfurt',
      country: 'Germany',
      costOfLivingIndex: 90,
      rentIndex: 75,
      groceriesIndex: 95,
      healthcareCostMonthly: 380,
      taxRate: 0.18,
    });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['Frankfurt']);
  });
});