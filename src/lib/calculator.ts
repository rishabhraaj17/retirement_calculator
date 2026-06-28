import { City, UserInputs, Assumptions, CalculationResult, CostBreakdown, DrawdownDataPoint } from '../types';

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
  const inflation = assumptions.countryInflation
    ? (city.country === 'Germany' ? assumptions.countryInflation.Germany : assumptions.countryInflation.India)
    : assumptions.inflationRate;

  const baseMonthlyExpense = 3000;
  const monthlyExpenses = (baseMonthlyExpense * city.costOfLivingIndex) / 100;
  const housing = monthlyExpenses * 0.35;
  const groceries = monthlyExpenses * 0.18;
  const healthcare = city.healthcareCostMonthly;
  const other = Math.max(0, monthlyExpenses - housing - groceries - healthcare);
  const breakdown: CostBreakdown = { monthlyExpenses, housing, groceries, healthcare, other };

  const requiredFund = calculatePresentValue(
    monthlyExpenses,
    inflation,
    assumptions.investmentReturn,
    assumptions.retirementYears
  );

  const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);
  const monthlyReturn = assumptions.investmentReturn / 12;
  const totalMonths = yearsToRetirement * 12;

  const fvCurrentSavings = inputs.currentSavings * Math.pow(1 + assumptions.investmentReturn, yearsToRetirement);
  const fvContributions = monthlyReturn > 0
    ? inputs.monthlyContribution * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn)
    : inputs.monthlyContribution * totalMonths;

  const projectedFund = Math.round(fvCurrentSavings + fvContributions);
  const fundingGap = Math.max(0, requiredFund - projectedFund);

  // Calculate Required Monthly SIP to cover the gap
  let requiredSip = 0;
  if (fundingGap > 0 && yearsToRetirement > 0) {
    requiredSip = monthlyReturn > 0
      ? Math.round(fundingGap / (((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn)))
      : Math.round(fundingGap / totalMonths);
  }

  // Calculate Lump Sum needed today to cover the gap
  const requiredLumpSum = fundingGap > 0
    ? Math.round(fundingGap / Math.pow(1 + assumptions.investmentReturn, yearsToRetirement))
    : 0;

  // Generate Drawdown Timeline
  const drawdownTimeline: DrawdownDataPoint[] = [];
  let currentBalance = inputs.currentSavings;
  let netContributions = inputs.currentSavings;

  // Accumulation Phase
  for (let age = inputs.currentAge; age <= inputs.retirementAge; age++) {
    drawdownTimeline.push({
      age,
      phase: 'Accumulation',
      balance: Math.round(currentBalance),
      netContributions: Math.round(netContributions),
    });

    if (age < inputs.retirementAge) {
      currentBalance = currentBalance * (1 + assumptions.investmentReturn) + (inputs.monthlyContribution * 12);
      netContributions += inputs.monthlyContribution * 12;
    }
  }

  // Transition: add Lump Sum at retirement start if any
  let retirementBalance = projectedFund;
  
  // Drawdown Phase
  for (let year = 1; year <= assumptions.retirementYears; year++) {
    const currentRetAge = inputs.retirementAge + year;
    const inflatedExpense = monthlyExpenses * Math.pow(1 + inflation, year - 1) * 12;
    
    // Withdraw at start of year, compound remainder at end of year
    retirementBalance = Math.max(0, retirementBalance - inflatedExpense);
    retirementBalance = retirementBalance * (1 + assumptions.investmentReturn);

    drawdownTimeline.push({
      age: currentRetAge,
      phase: 'Retirement',
      balance: Math.round(retirementBalance),
      netContributions: Math.round(netContributions),
    });
  }

  return {
    city,
    requiredFund,
    projectedFund,
    fundingGap,
    yearsToRetirement,
    totalMonthlyNeed: monthlyExpenses,
    breakdown,
    requiredSip,
    requiredLumpSum,
    drawdownTimeline,
  };
}
