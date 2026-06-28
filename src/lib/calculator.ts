import { City, UserInputs, Assumptions, CalculationResult, CostBreakdown } from '../types';

/**
 * Calculate the present value (at retirement day 1) of all future monthly expenses.
 * Accounts for inflation during retirement and the investment return on the remaining fund.
 */
export function calculatePresentValue(
  monthlyExpense: number,
  inflationRate: number,
  returnRate: number,
  retirementYears: number
): number {
  if (retirementYears <= 0) return 0;

  let presentValue = 0;
  const monthlyReturnRate = returnRate / 12;

  for (let year = 1; year <= retirementYears; year++) {
    const inflatedExpense = monthlyExpense * Math.pow(1 + inflationRate, year - 1);
    for (let month = 1; month <= 12; month++) {
      const pvFactor = Math.pow(1 + monthlyReturnRate, year * 12 - (12 - month));
      presentValue += inflatedExpense / pvFactor;
    }
  }

  return Math.round(presentValue);
}

export function calculateRetirementFund(
  city: City,
  inputs: UserInputs,
  assumptions: Assumptions
): CalculationResult {
  // Monthly expenses in today's money, scaled by city cost-of-living
  const baseMonthlyExpense = 3000;
  const monthlyExpenses = (baseMonthlyExpense * city.costOfLivingIndex) / 100;

  // Cost breakdown using realistic budget proportions
  const housing = monthlyExpenses * 0.35;
  const groceries = monthlyExpenses * 0.18;
  const healthcare = city.healthcareCostMonthly;
  const other = Math.max(0, monthlyExpenses - housing - groceries - healthcare);

  const breakdown: CostBreakdown = { monthlyExpenses, housing, groceries, healthcare, other };

  // Total lump sum needed on retirement day 1
  const requiredFund = calculatePresentValue(
    monthlyExpenses,
    assumptions.inflationRate,
    assumptions.investmentReturn,
    assumptions.retirementYears
  );

  // Accumulation phase: years from now until retirement
  const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);
  const monthlyReturn = assumptions.investmentReturn / 12;
  const totalMonths = yearsToRetirement * 12;

  // Future value of current savings, compounded at investment return
  const fvCurrentSavings = inputs.currentSavings * Math.pow(1 + assumptions.investmentReturn, yearsToRetirement);

  // Future value of monthly contributions (ordinary annuity)
  const fvContributions = monthlyReturn > 0
    ? inputs.monthlyContribution * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn)
    : inputs.monthlyContribution * totalMonths;

  const projectedFund = Math.round(fvCurrentSavings + fvContributions);
  const fundingGap = Math.max(0, requiredFund - projectedFund);

  return {
    city,
    requiredFund,
    projectedFund,
    fundingGap,
    yearsToRetirement,
    totalMonthlyNeed: monthlyExpenses,
    breakdown,
  };
}
