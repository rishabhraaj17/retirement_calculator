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
  const country = city.country === 'Germany' ? 'Germany' : 'India';
  const inflation = assumptions.countryInflation?.[country] !== undefined
    ? assumptions.countryInflation[country]
    : assumptions.inflationRate;
  const investmentReturn = assumptions.countryInvestmentReturn?.[country] !== undefined
    ? assumptions.countryInvestmentReturn[country]
    : assumptions.investmentReturn;

  // Monthly expenses in today's money, scaled by city cost-of-living
  let monthlyExpenses = 0;
  let housing = 0;
  let groceries = 0;
  let healthcare = 0;
  let other = 0;

  const overrides = inputs.cityCategoryOverrides?.[city.id];
  const totalOverride = inputs.cityExpenseOverrides?.[city.id];

  if (totalOverride !== undefined || overrides !== undefined) {
    if (totalOverride !== undefined && overrides === undefined) {
      monthlyExpenses = totalOverride;
      housing = monthlyExpenses * 0.35;
      groceries = monthlyExpenses * 0.18;
      healthcare = city.country === 'Germany' ? 0 : (inputs.baseHealthcare ?? 350) * city.costOfLivingIndex / 100;
      other = Math.max(0, monthlyExpenses - housing - groceries - healthcare);
    } else {
      const totalBase = inputs.baseMonthlyExpense ?? 3000;
      const baseRent = inputs.baseRent ?? (totalBase * 0.35);
      const baseGroceries = inputs.baseGroceries ?? (totalBase * 0.18);
      const baseHealthcare = inputs.baseHealthcare ?? (totalBase * 0.1167);
      const baseOthers = inputs.baseOthers ?? Math.max(0, totalBase - baseRent - baseGroceries - baseHealthcare);

      housing = overrides?.rent !== undefined ? overrides.rent : ((baseRent * city.rentIndex) / 88);
      groceries = overrides?.groceries !== undefined ? overrides.groceries : ((baseGroceries * city.groceriesIndex) / 105);
      healthcare = city.country === 'Germany' ? 0 : (overrides?.healthcare !== undefined ? overrides.healthcare : ((baseHealthcare * city.costOfLivingIndex) / 100));
      other = overrides?.others !== undefined ? overrides.others : ((baseOthers * city.costOfLivingIndex) / 100);
      monthlyExpenses = housing + groceries + healthcare + other;
    }
  } else {
    const totalBase = inputs.baseMonthlyExpense ?? 3000;
    const baseRent = inputs.baseRent ?? (totalBase * 0.35);
    const baseGroceries = inputs.baseGroceries ?? (totalBase * 0.18);
    const baseHealthcare = inputs.baseHealthcare ?? (totalBase * 0.1167);
    const baseOthers = inputs.baseOthers ?? Math.max(0, totalBase - baseRent - baseGroceries - baseHealthcare);

    housing = (baseRent * city.rentIndex) / 88;
    groceries = (baseGroceries * city.groceriesIndex) / 105;
    healthcare = city.country === 'Germany' ? 0 : (baseHealthcare * city.costOfLivingIndex) / 100;
    other = (baseOthers * city.costOfLivingIndex) / 100;
    monthlyExpenses = housing + groceries + healthcare + other;
  }
  // Cost breakdown using realistic budget proportions
  const breakdown: CostBreakdown = { monthlyExpenses, housing, groceries, healthcare, other };

  // Total lump sum needed on retirement day 1
  const requiredFund = calculatePresentValue(
    monthlyExpenses,
    inflation,
    investmentReturn,
    assumptions.retirementYears
  );

  // Accumulation phase: years from now until retirement
  const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);
  const monthlyReturn = investmentReturn / 12;
  const totalMonths = yearsToRetirement * 12;

  // Future value of current savings, compounded at investment return
  const fvCurrentSavings = inputs.currentSavings * Math.pow(1 + investmentReturn, yearsToRetirement);
  // Future value of monthly contributions (ordinary annuity)
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
    ? Math.round(fundingGap / Math.pow(1 + investmentReturn, yearsToRetirement))
    : 0;

  // Generate Drawdown Timeline
  const drawdownTimeline: DrawdownDataPoint[] = [];
  let netContributions = inputs.currentSavings;

  // Accumulation Phase
  for (let age = inputs.currentAge; age <= inputs.retirementAge; age++) {
    const years = age - inputs.currentAge;
    const fvSavingsAtAge = inputs.currentSavings * Math.pow(1 + investmentReturn, years);
    const monthsAtAge = years * 12;
    const fvContributionsAtAge = monthlyReturn > 0
      ? inputs.monthlyContribution * ((Math.pow(1 + monthlyReturn, monthsAtAge) - 1) / monthlyReturn)
      : inputs.monthlyContribution * monthsAtAge;
    const balance = Math.round(fvSavingsAtAge + fvContributionsAtAge);
    netContributions = inputs.currentSavings + (inputs.monthlyContribution * 12 * years);

    drawdownTimeline.push({
      age,
      phase: 'Accumulation',
      balance,
      netContributions: Math.round(netContributions),
    });
  }

  // Transition: add Lump Sum at retirement start if any
  let retirementBalance = projectedFund;
  
  // Drawdown Phase
  for (let year = 1; year <= assumptions.retirementYears; year++) {
    const currentRetAge = inputs.retirementAge + year;
    const inflatedExpense = monthlyExpenses * Math.pow(1 + inflation, year - 1) * 12;
    
    // Withdraw at start of year, compound remainder at end of year
    retirementBalance = Math.max(0, retirementBalance - inflatedExpense);
    retirementBalance = retirementBalance * (1 + investmentReturn);

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
