import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import CitySelector from '../CitySelector';

// Mock fetch globally
global.fetch = jest.fn();

describe('CitySelector', () => {
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(
      <CitySelector
        selectedCities={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByTestId('city-selector-loading')).toBeInTheDocument();
  });

  it('renders cities grouped by country after successful fetch', async () => {
    const mockCities = [
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
        id: 'berlin',
        name: 'Berlin',
        country: 'Germany',
        costOfLivingIndex: 82,
        rentIndex: 68,
        groceriesIndex: 98,
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
      {
        id: 'mumbai',
        name: 'Mumbai',
        country: 'India',
        costOfLivingIndex: 30,
        rentIndex: 35,
        groceriesIndex: 28,
        healthcareCostMonthly: 200,
        taxRate: 0.10,
      },
      {
        id: 'bangalore',
        name: 'Bangalore',
        country: 'India',
        costOfLivingIndex: 28,
        rentIndex: 25,
        groceriesIndex: 26,
        healthcareCostMonthly: 180,
        taxRate: 0.10,
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCities,
    });

    render(
      <CitySelector
        selectedCities={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('city-selector')).toBeInTheDocument();
    });

    // Check for country group headers
    expect(screen.getByText('Germany')).toBeInTheDocument();
    expect(screen.getByText('India')).toBeInTheDocument();

    // Check for city checkboxes
    expect(screen.getByTestId('checkbox-munich')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-berlin')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-delhi-ncr')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-mumbai')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-bangalore')).toBeInTheDocument();
  });

  it('calls onSelectionChange when a city is selected', async () => {
    const mockCities = [
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
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCities,
    });

    render(
      <CitySelector
        selectedCities={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('city-selector')).toBeInTheDocument();
    });

    const checkbox = screen.getByTestId('checkbox-munich');
    fireEvent.click(checkbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['Munich']);
  });

  it('calls onSelectionChange when a city is deselected', async () => {
    const mockCities = [
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
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCities,
    });

    render(
      <CitySelector
        selectedCities={['Munich']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('city-selector')).toBeInTheDocument();
    });

    const checkbox = screen.getByTestId('checkbox-munich');
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('shows error state when fetch fails and uses fallback data', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <CitySelector
        selectedCities={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Wait for the async error handling to complete
    await waitFor(() => {
      expect(screen.getByTestId('city-selector-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Error loading cities/i)).toBeInTheDocument();
  });

  it('displays cost of living index for each city', async () => {
    const mockCities = [
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
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCities,
    });

    render(
      <CitySelector
        selectedCities={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Cost of Living Index: 100/i)).toBeInTheDocument();
    });
  });
});