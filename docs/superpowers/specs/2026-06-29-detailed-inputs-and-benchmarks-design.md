# Detailed Inputs and Benchmark Restructuring - Design Specification

This specification outlines the support for country-specific investment returns, custom expense category splits (Rent, Groceries, Others), Germany/India healthcare tax differences, hover explanations (tooltips), and the removal of redundant global assumptions.

## 1. Simplified & Country-Specific Assumptions
To eliminate confusion between global inputs and country benchmarks:
*   **Remove Global Sliders:** Remove the "Inflation Rate" and "Investment Return" sliders from the sidebar `InputForm.tsx`.
*   **Country Benchmarks Panel:** In `AssumptionsPanel.tsx`, display and make editable:
    *   **Germany:** Inflation Rate (default 5%), Expected Investment Return (default 6%).
    *   **India:** Inflation Rate (default 4%), Expected Investment Return (default 8%).
*   **State Alignment:** The `Assumptions` object is updated:
    ```typescript
    export interface Assumptions {
      retirementYears: number;
      countryInflation: {
        Germany: number;
        India: number;
      };
      countryInvestmentReturn: {
        Germany: number;
        India: number;
      };
    }
    ```

## 2. Collapsible Expense Breakdown settings
Add a collapsible "Monthly Expense Details" section inside `InputForm.tsx` under Finances:
*   **Custom Category Inputs:**
    *   **Rent:** Base rent (default €1,050). Scales across cities using `city.rentIndex`.
    *   **Groceries:** Base groceries (default €540). Scales across cities using `city.groceriesIndex`.
    *   **Others:** Base other expenses (default €1,060). Scales across cities using `city.costOfLivingIndex`.
    *   **Healthcare:** Base healthcare (default €350).
        *   **Germany:** Set to €0 in the breakdown. Display note: *"Covered by health insurance included in German tax rate."*
        *   **India:** Kept as a separate cost. Scales using India's cost of living index.
*   **Automatic Summation:** The sum of these categories determines the `baseMonthlyExpense` (default €3,000 total). Editing category values updates the total base expense, and vice-versa.

## 3. Premium Hover Tooltips
Add hover-to-reveal tooltips next to key inputs using a styled info icon (`ⓘ`).
*   **Current Savings:** *Total amount saved today (cash, stock, mutual funds).*
*   **Monthly Contribution:** *How much you plan to save/invest every month until retirement.*
*   **Expected Return:** *Estimated annual compound growth of investments before retirement.*
*   **Inflation Rate:** *Expected average annual increase in cost of living over time.*
*   **Germany / India Benchmarks:** Clarify country differences (e.g. India has higher inflation but higher expected interest returns compared to Germany).

## 4. Calculation Logic Updates (`src/lib/calculator.ts`)
*   Read `assumptions.countryInflation[country]` and `assumptions.countryInvestmentReturn[country]` for calculations.
*   Compute city-specific healthcare costs:
    ```typescript
    const healthcare = city.country === 'Germany' ? 0 : (inputs.baseHealthcare ?? 350) * city.costOfLivingIndex / 100;
    ```
*   Scale categories individually (Rent by `rentIndex`, Groceries by `groceriesIndex`, Others by `costOfLivingIndex`).
