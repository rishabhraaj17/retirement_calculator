import { calculateRetirementFund, calculatePresentValue } from '../calculator';
import { City, UserInputs, Assumptions } from '../../types';

describe('Retirement Calculator', () => {
  // Mock city data for testing
  const mockMunich: City = {
    id: 'munich',
    name: 'Munich',
    country: 'Germany',
    costOfLivingIndex: 100,
    rentIndex: 80,
    groceriesIndex: 110,
    healthcareCostMonthly: 200,
    taxRate: 0.3,
  };

  const mockInputs: UserInputs = {
    currentAge: 30,
    retirementAge: 65,
    currentSavings: 50000,
    monthlyContribution: 1000,
  };

  const mockAssumptions: Assumptions = {
    investmentReturn: 0.06,
    inflationRate: 0.02,
    retirementYears: 20,
  };

  describe('calculateRetirementFund', () => {
    it('should return a positive value for required fund', () => {
      const result = calculateRetirementFund(mockMunich, mockInputs, mockAssumptions);
      expect(result.requiredFund).toBeGreaterThan(0);
    });

    it('should return city matching the input', () => {
      const result = calculateRetirementFund(mockMunich, mockInputs, mockAssumptions);
      expect(result.city).toEqual(mockMunich);
    });

    it('should return a positive total monthly need', () => {
      const result = calculateRetirementFund(mockMunich, mockInputs, mockAssumptions);
      expect(result.totalMonthlyNeed).toBeGreaterThan(0);
    });

    it('should return a valid cost breakdown', () => {
      const result = calculateRetirementFund(mockMunich, mockInputs, mockAssumptions);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.monthlyExpenses).toBeGreaterThan(0);
      expect(result.breakdown.housing).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.groceries).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.healthcare).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.other).toBeGreaterThanOrEqual(0);
    });

    it('should calculate higher fund for higher cost of living city', () => {
      const highCostCity: City = {
        ...mockMunich,
        costOfLivingIndex: 150,
      };
      const lowCostCity: City = {
        ...mockMunich,
        costOfLivingIndex: 80,
      };

      const highCostResult = calculateRetirementFund(highCostCity, mockInputs, mockAssumptions);
      const lowCostResult = calculateRetirementFund(lowCostCity, mockInputs, mockAssumptions);

      expect(highCostResult.requiredFund).toBeGreaterThan(lowCostResult.requiredFund);
    });
  });

  describe('calculatePresentValue', () => {
    it('should calculate present value with known values', () => {
      // Test with simple values: monthly expense of 3000, no inflation/return
      const presentValue = calculatePresentValue(3000, 0, 0, 20);
      // Without inflation and return, PV = monthlyExpense * years * 12
      expect(presentValue).toBe(720000);
    });

    it('should return positive value for valid inputs', () => {
      const presentValue = calculatePresentValue(3000, 0.02, 0.06, 20);
      expect(presentValue).toBeGreaterThan(0);
    });

    it('should handle zero years gracefully', () => {
      const presentValue = calculatePresentValue(3000, 0.02, 0.06, 0);
      expect(presentValue).toBe(0);
    });

    it('should inflate future expenses and discount them', () => {
      // Higher inflation should increase required fund
      const pvLowInflation = calculatePresentValue(3000, 0.01, 0.06, 20);
      const pvHighInflation = calculatePresentValue(3000, 0.05, 0.06, 20);

      expect(pvHighInflation).toBeGreaterThan(pvLowInflation);
    });
  });
});