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

    it('should compute requiredSip, requiredLumpSum, and drawdownTimeline', () => {
      const result = calculateRetirementFund(mockMunich, mockInputs, {
        ...mockAssumptions,
        countryInflation: { Germany: 0.05, India: 0.03 }
      });
      expect(result.requiredSip).toBeDefined();
      expect(result.requiredLumpSum).toBeDefined();
      expect(result.drawdownTimeline).toBeDefined();
      expect(result.drawdownTimeline.length).toBeGreaterThan(0);
    });

    it('should use baseMonthlyExpense from inputs', () => {
      const result = calculateRetirementFund(mockMunich, { ...mockInputs, baseMonthlyExpense: 4000 }, mockAssumptions);
      expect(result.totalMonthlyNeed).toBe(4000); // Munich CoL is 100
    });

    it('should apply cityExpenseOverrides directly', () => {
      const result = calculateRetirementFund(mockMunich, {
        ...mockInputs,
        cityExpenseOverrides: { munich: 2500 }
      }, mockAssumptions);
      expect(result.totalMonthlyNeed).toBe(2500);
    });

    it('should select country-specific inflation overrides correctly', () => {
      // Germany city (mockMunich) with override
      const resultGermany = calculateRetirementFund(mockMunich, mockInputs, {
        ...mockAssumptions,
        countryInflation: { Germany: 0.05, India: 0.03 }
      });
      // India city with override
      const mockDelhi: City = {
        ...mockMunich,
        name: 'Delhi NCR',
        country: 'India',
      };
      const resultIndia = calculateRetirementFund(mockDelhi, mockInputs, {
        ...mockAssumptions,
        countryInflation: { Germany: 0.05, India: 0.03 }
      });

      // No overrides
      const resultNoOverride = calculateRetirementFund(mockMunich, mockInputs, mockAssumptions);

      // Verify that Germany inflation rate of 0.05 was used (larger required fund than no override of 0.02)
      expect(resultGermany.requiredFund).toBeGreaterThan(resultNoOverride.requiredFund);
      
      // Verify that India inflation rate of 0.03 was used for Delhi
      expect(resultGermany.requiredFund).toBeGreaterThan(resultIndia.requiredFund);
      expect(resultIndia.requiredFund).toBeGreaterThan(resultNoOverride.requiredFund);
    });

    it('should calculate zero SIP and Lump Sum when projected fund exceeds required fund', () => {
      const result = calculateRetirementFund(mockMunich, mockInputs, mockAssumptions);
      expect(result.fundingGap).toBe(0);
      expect(result.requiredSip).toBe(0);
      expect(result.requiredLumpSum).toBe(0);
    });

    it('should calculate positive SIP and Lump Sum when gap exists', () => {
      const poorInputs: UserInputs = {
        currentAge: 30,
        retirementAge: 65,
        currentSavings: 0,
        monthlyContribution: 0,
      };
      const result = calculateRetirementFund(mockMunich, poorInputs, mockAssumptions);
      expect(result.fundingGap).toBeGreaterThan(0);
      expect(result.requiredSip).toBeGreaterThan(0);
      expect(result.requiredLumpSum).toBeGreaterThan(0);

      // Verify lump sum math: requiredLumpSum * (1 + investmentReturn)^yearsToRetirement should be approx fundingGap
      const years = 65 - 30;
      const expectedGapFromLumpSum = result.requiredLumpSum * Math.pow(1 + mockAssumptions.investmentReturn, years);
      expect(Math.abs(expectedGapFromLumpSum - result.fundingGap)).toBeLessThan(result.requiredLumpSum * 0.05); // allow rounding error
    });

    it('should track accumulation and drawdown phases correctly in drawdownTimeline', () => {
      const result = calculateRetirementFund(mockMunich, mockInputs, mockAssumptions);
      const timeline = result.drawdownTimeline;

      // Accumulation phase should start at currentAge and end at retirementAge
      const accumulationPoints = timeline.filter(p => p.phase === 'Accumulation');
      expect(accumulationPoints[0].age).toBe(mockInputs.currentAge);
      expect(accumulationPoints[accumulationPoints.length - 1].age).toBe(mockInputs.retirementAge);

      // Retirement phase should start at retirementAge + 1 and have retirementYears length
      const retirementPoints = timeline.filter(p => p.phase === 'Retirement');
      expect(retirementPoints.length).toBe(mockAssumptions.retirementYears);
      expect(retirementPoints[0].age).toBe(mockInputs.retirementAge + 1);
      expect(retirementPoints[retirementPoints.length - 1].age).toBe(mockInputs.retirementAge + mockAssumptions.retirementYears);

      // Ensure balance and net contributions are tracking as expected
      expect(accumulationPoints[0].balance).toBe(mockInputs.currentSavings);
      expect(accumulationPoints[0].netContributions).toBe(mockInputs.currentSavings);
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