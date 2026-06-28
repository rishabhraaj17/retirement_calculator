// Type definitions for Retirement Fund Comparison App

// Country type - only Germany and India supported
export type Country = 'Germany' | 'India';

// Supported city names
export type CityName = 'Munich' | 'Berlin' | 'Delhi NCR' | 'Mumbai' | 'Bangalore';

// City interface with cost of living and financial metrics
export interface City {
  id: string;
  name: CityName;
  country: Country;
  costOfLivingIndex: number;
  rentIndex: number;
  groceriesIndex: number;
  healthcareCostMonthly: number;
  taxRate: number;
}

// User input interface for personal details and financial inputs
export interface UserInputs {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
}

// Assumptions interface for calculation parameters
export interface Assumptions {
  investmentReturn: number; // Annual return rate (default 6%)
  inflationRate: number; // Annual inflation rate
  retirementYears: number; // Years in retirement (life expectancy - retirement age)
}

// Breakdown of cost components for a city
export interface CostBreakdown {
  monthlyExpenses: number;
  housing: number;
  groceries: number;
  healthcare: number;
  other: number;
}

// Calculation result interface
export interface CalculationResult {
  city: City;
  requiredFund: number;      // Total lump sum needed on retirement day 1
  projectedFund: number;     // Projected savings at retirement (compounded)
  fundingGap: number;        // Shortfall (0 if overfunded)
  yearsToRetirement: number;
  totalMonthlyNeed: number;
  breakdown: CostBreakdown;
}

// API cache interface for caching external API responses
export interface ApiCache {
  timestamp: string; // ISO date string when data was fetched
  data: City[]; // Array of city data from APIs
  expiresAt: string; // ISO date string when cache expires
}