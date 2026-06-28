# Custom Monthly Expenses - Design Specification

This specification outlines the support for entering custom monthly expenses globally and overriding them on a per-city basis, with comparison indicators against city-wide average metrics.

## 1. Requirements & User Intent
*   **Global Base Monthly Expense:** Add a slider in the sidebar settings allowing users to change the base monthly cost of living (default €3,000). This scales proportionally to each city based on its Cost of Living index.
*   **City-Specific Expense Overrides:** Allow users to directly input a custom monthly expense for any specific city (e.g. entering €2,000 for Berlin directly), bypassing the scaled average.
*   **Compare to City Averages:** Display a visual indicator/banner comparing the user's custom expense against the standard city-wide average (scaled from the €3,000 baseline). Provide a quick "Reset" action.
*   **Inline Editing:** Allow editing the monthly need directly in the `SingleCityDashboard` and the `ComparisonDashboard` table.

## 2. Technical Architecture & State (Approach A)
The state model is extended to store `baseMonthlyExpense` (global slider) and `cityExpenseOverrides` (a map of city IDs to custom values).

### State Model Extension
```typescript
// src/types/index.ts
export interface UserInputs {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  baseMonthlyExpense?: number;                    // Global base expense
  cityExpenseOverrides?: Record<string, number>;  // Map of city.id -> custom expense
}
```

### Component Handoffs
*   **`InputForm.tsx`:** Renders the "Base Monthly Expense" slider in the "Finances" section (default €3,000, range €500 to €20,000, step €100).
*   **`SingleCityDashboard.tsx`:** Renders an input for the city's monthly need. If overridden, shows a relative comparison badge (e.g., `+15% vs. avg`) and a "Reset to Average" button.
*   **`ComparisonDashboard.tsx`:** Renders the "Monthly Need" cell for each city as a small inline input box to allow direct overrides from the comparison table.

## 3. Calculation Enhancements (`src/lib/calculator.ts`)
Update `calculateRetirementFund` to support overrides:
```typescript
export function calculateRetirementFund(
  city: City,
  inputs: UserInputs,
  assumptions: Assumptions
): CalculationResult {
  const baseMonthlyExpense = inputs.baseMonthlyExpense ?? 3000;
  
  // Use city override if defined, otherwise scale from global base
  const monthlyExpenses = inputs.cityExpenseOverrides?.[city.id] !== undefined
    ? (inputs.cityExpenseOverrides[city.id] || 0)
    : (baseMonthlyExpense * city.costOfLivingIndex) / 100;
    
  // Proportional expense breakdown
  const housing = monthlyExpenses * 0.35;
  const groceries = monthlyExpenses * 0.18;
  const healthcare = city.healthcareCostMonthly;
  const other = Math.max(0, monthlyExpenses - housing - groceries - healthcare);
  const breakdown: CostBreakdown = { monthlyExpenses, housing, groceries, healthcare, other };
  
  // Rest of calculation remains identical...
}
```

## 4. Testing Plan
*   Add unit tests in `src/lib/__tests__/calculator.test.ts` verifying that `cityExpenseOverrides` correctly bypass the scaling logic and are reflected in all outputs.
*   Update `src/components/__tests__/InputForm.test.tsx` for the new slider.
*   Update `src/components/__tests__/SingleCityDashboard.test.tsx` and `src/components/__tests__/ComparisonDashboard.test.tsx` to verify that custom inputs function and update callbacks trigger correctly.
