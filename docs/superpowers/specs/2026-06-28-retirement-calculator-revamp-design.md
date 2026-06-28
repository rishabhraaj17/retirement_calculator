# Retirement Calculator Revamp - Design Specification

This document details the architectural and UI revamp of the RetireAnywhere retirement calculator. The new design is inspired by premium Indian financial platforms like Groww and Mutual Funds Sahi Hai, combined with the existing multi-city comparison features.

## 1. Requirements & Intent
*   **Aesthetic Overhaul:** Upgrade to a premium dark/light layout with interactive sliders, rich typography, smooth transitions, and glowing HSL/theme-aligned accents.
*   **Country-Specific Inflation Rates:** Allow the user to manually edit and override the default inflation rate benchmarks for Germany (Eurostat) and India (RBI).
*   **Required Additional SIP/Lump Sum:** Calculate and display the monthly contribution (SIP) or lump sum required starting today to bridge the retirement funding gap.
*   **Drawdown Projection Chart:** Add an interactive timeline chart showing the accumulation of savings until retirement and the subsequent drawdown of the corpus during retirement.
*   **Dual-View Dashboard:**
    *   **Single City Focus View:** Deep dive into a single selected city, featuring cost breakdown donuts, drawdown charts, and specific savings goals.
    *   **Compare Cities View:** Side-by-side comparison of multiple cities with bar charts, expense matrices, and smart insights.

## 2. Technical Architecture & State (Approach 1)
All inputs, active view tabs, selected cities, and overrides are managed in the main page component (`src/app/page.tsx`). Computations are performed inside a custom hook or reactive loop and propagated down.

### State Model
```typescript
interface UserInputs {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
}

interface Assumptions {
  investmentReturn: number;
  inflationRate: number;      // Deprecated as global; replaced by countryOverrides
  retirementYears: number;
}

interface InflationOverrides {
  Germany: number;            // Custom rate for German cities
  India: number;              // Custom rate for Indian cities
}
```

### Component Structure
*   `src/app/page.tsx` — Orchestrator, contains state, calculates outcomes, determines active view tab.
*   `src/components/InputForm.tsx` — Left sidebar component with upgraded inputs (sliders + numeric boxes).
*   `src/components/CitySelector.tsx` — Tags/buttons to toggle selected cities grouped by country.
*   `src/components/AssumptionsPanel.tsx` — Interactive card fields for Germany and India manual inflation overrides.
*   `src/components/SingleCityDashboard.tsx` — New component for single-city analysis (Donut breakdown, Area drawdown chart, SIP gap recommendations).
*   `src/components/ComparisonDashboard.tsx` — Revamped multi-city comparison dashboard (Bar chart, Table grid, Savings tip banner).

## 3. Calculation Enhancements (`src/lib/calculator.ts`)

### 3.1. Inflation Selection
For any city $c$, the calculator selects the inflation rate $\text{inf}_c$:
$$\text{inf}_c = \begin{cases} 
\text{overrides.Germany} & \text{if } c.\text{country} = \text{"Germany"} \\
\text{overrides.India} & \text{if } c.\text{country} = \text{"India"}
\end{cases}$$

### 3.2. Present Value of Retirement Expenses (Required Corpus)
To find the required lump sum needed on Day 1 of retirement:
$$\text{Required Corpus} = \sum_{t=1}^{12 \times \text{retirementYears}} \frac{\text{inflatedExpense}(t)}{(1 + r_m)^t}$$
where $r_m = \text{investmentReturn} / 12$, and $\text{inflatedExpense}(t)$ is the monthly expense inflated annually.

### 3.3. Future Value of Existing Savings & Planned Contributions
$$\text{FV}_{\text{savings}} = \text{currentSavings} \times (1 + \text{investmentReturn})^{\text{yearsToRetirement}}$$
$$\text{FV}_{\text{contributions}} = \text{monthlyContribution} \times \frac{(1 + r_m)^{12 \times \text{yearsToRetirement}} - 1}{r_m}$$
$$\text{Projected Fund} = \text{FV}_{\text{savings}} + \text{FV}_{\text{contributions}}$$
$$\text{Funding Gap} = \max(0, \text{Required Corpus} - \text{Projected Fund})$$

### 3.4. Required Additional SIP to Bridge Gap
To bridge the `Funding Gap` at retirement, the user needs to save an additional monthly amount:
$$\text{Required Additional SIP} = \frac{\text{Funding Gap}}{\text{FV Annuity Factor}}$$
where:
$$\text{FV Annuity Factor} = \frac{(1 + r_m)^{12 \times \text{yearsToRetirement}} - 1}{r_m}$$

### 3.5. Drawdown Projection Timeline
A yearly array of balances will be calculated to power the accumulation/drawdown chart.
*   **Accumulation Phase ($y = \text{currentAge} \dots \text{retirementAge}$):**
    $$\text{Balance}(y) = \text{Balance}(y-1) \times (1 + \text{investmentReturn}) + 12 \times \text{monthlyContribution} \times (1 + r_m)^6$$
*   **Drawdown Phase ($y = \text{retirementAge} \dots \text{retirementAge} + \text{retirementYears}$):**
    $$\text{Balance}(y) = (\text{Balance}(y-1) - \text{AnnualExpense}(y)) \times (1 + \text{investmentReturn})$$

## 4. UI Design & Polish
*   **Dark Mode Defaults:** Glowing accents, deep space backdrops (`#07080F`), soft cards (`#0D0F1A`), borders (`#22263C`).
*   **Sliders:** Customized range inputs with tooltip indicators and direct numeric input text boxes for fine-tuning.
*   **Drawdown Timeline Chart:** Recharts `AreaChart` with gradient fill showing the mountain-like curve (rising to the peak at retirement age and falling to zero at the end of life expectancy).

## 5. Testing & Verification
*   Add unit tests in `src/lib/__tests__/calculator.test.ts` for:
    *   Required SIP calculation.
    *   Country-specific inflation overrides.
    *   Timeline data generation.
*   Update `src/components/__tests__/InputForm.test.tsx` and `src/components/__tests__/CitySelector.test.tsx` to align with the new selectors, sliders, error boundaries, and benchmarks.
