# Detailed Inputs and Benchmarks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up duplicate assumptions settings, add country-specific inflation & expected investment return benchmarks, introduce individual expense category slider details (Rent, Groceries, Others) that automatically scale across cities using specific index weights, handle German/Indian healthcare differences, and add hover-to-reveal tooltips.

---

### Task 1: Type Definitions & Calculator Updates

**Files:**
* Modify: `src/types/index.ts`
* Modify: `src/lib/calculator.ts`
* Modify: `src/lib/__tests__/calculator.test.ts`

- [ ] **Step 1: Extend Types in `src/types/index.ts`**
  Add `baseRent`, `baseGroceries`, `baseOthers`, `baseHealthcare` to `UserInputs`.
  Extend `Assumptions` to store `countryInvestmentReturn` alongside `countryInflation`:
  ```typescript
  export interface UserInputs {
    currentAge: number;
    retirementAge: number;
    currentSavings: number;
    monthlyContribution: number;
    baseMonthlyExpense?: number;
    baseRent?: number;
    baseGroceries?: number;
    baseOthers?: number;
    baseHealthcare?: number;
    cityExpenseOverrides?: Record<string, number>;
  }

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
    inflationRate?: number; // legacy/fallback
    investmentReturn?: number; // legacy/fallback
  }
  ```

- [ ] **Step 2: Update `calculateRetirementFund` in `src/lib/calculator.ts`**
  Modify calculation logic:
  * Extract country-specific inflation rate and expected return:
    ```typescript
    const country = city.country === 'Germany' ? 'Germany' : 'India';
    const inflation = assumptions.countryInflation?.[country] ?? assumptions.inflationRate ?? 0.04;
    const investmentReturn = assumptions.countryInvestmentReturn?.[country] ?? assumptions.investmentReturn ?? 0.06;
    ```
  * Calculate monthly expenses using category scales or direct overrides:
    ```typescript
    let monthlyExpenses = 0;
    let housing = 0;
    let groceries = 0;
    let healthcare = 0;
    let other = 0;

    if (inputs.cityExpenseOverrides?.[city.id] !== undefined) {
      monthlyExpenses = inputs.cityExpenseOverrides[city.id] || 0;
      housing = monthlyExpenses * 0.35;
      groceries = monthlyExpenses * 0.18;
      healthcare = city.country === 'Germany' ? 0 : (inputs.baseHealthcare ?? 350) * city.costOfLivingIndex / 100;
      other = Math.max(0, monthlyExpenses - housing - groceries - healthcare);
    } else {
      // Scale categories by their specific city index weights
      const baseRent = inputs.baseRent ?? 1050;
      const baseGroceries = inputs.baseGroceries ?? 540;
      const baseOthers = inputs.baseOthers ?? 1060;
      const baseHealthcare = inputs.baseHealthcare ?? 350;

      housing = (baseRent * city.rentIndex) / 88; // Munich rentIndex is 88 as base reference
      groceries = (baseGroceries * city.groceriesIndex) / 105; // Munich groceriesIndex is 105 as base reference
      healthcare = city.country === 'Germany' ? 0 : (baseHealthcare * city.costOfLivingIndex) / 100;
      other = (baseOthers * city.costOfLivingIndex) / 100;
      monthlyExpenses = housing + groceries + healthcare + other;
    }
    const breakdown: CostBreakdown = { monthlyExpenses, housing, groceries, healthcare, other };
    ```
  * Use the country-specific `investmentReturn` duringaccumulation/timeline calculations.

- [ ] **Step 3: Update and write unit tests in `src/lib/__tests__/calculator.test.ts`**
  Confirm custom category scaling and country-specific rates behave properly. Run `npx jest src/lib/__tests__/calculator.test.ts`.

- [ ] **Step 4: Commit**
  Run: `git commit -am "feat: support detailed cost category scaling and country-specific investment returns"`

---

### Task 2: Revamped Assumptions Panel

**Files:**
* Modify: `src/components/AssumptionsPanel.tsx`
* Modify: `src/components/__tests__/AssumptionsPanel.test.tsx`

- [ ] **Step 1: Render Inflation & Expected Return inputs side-by-side**
  Modify [AssumptionsPanel.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/AssumptionsPanel.tsx):
  * For both Germany and India, render **two** editable fields side-by-side:
    * Inflation Rate (e.g. `5.0%`)
    * Expected Return (e.g. `6.0%`)
  * Wire change handlers to propagate changes to `assumptions.countryInflation` and `assumptions.countryInvestmentReturn` back to parent.

- [ ] **Step 2: Update unit tests in `AssumptionsPanel.test.tsx`**
  Ensure tests align with the updated double-input layout structure. Run `npx jest src/components/__tests__/AssumptionsPanel.test.tsx`.

- [ ] **Step 3: Commit**
  Run: `git commit -am "feat: implement double-benchmark card layout for country inflation and returns"`

---

### Task 3: Settings Sidebar Refactoring (Collapsible Breakdown & Removing Redundancies)

**Files:**
* Modify: `src/components/InputForm.tsx`
* Modify: `src/components/__tests__/InputForm.test.tsx`

- [ ] **Step 1: Clean up redundant controls**
  Modify [InputForm.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/InputForm.tsx):
  * Remove the global "Investment Return" and "Inflation Rate" Field elements.

- [ ] **Step 2: Add collapsible Expense Details section**
  Add a collapsible section under the total "Base Monthly Expense" field:
  * Toggle button: "Show Expense Details" / "Hide Expense Details".
  * Render sliders + numeric input fields for:
    * **Base Rent** (default €1050, range 0–5000, step 50)
    * **Base Groceries** (default €540, range 0–2000, step 20)
    * **Base Healthcare** (default €350, range 0–1000, step 10)
    * **Base Others** (default €1060, range 0–5000, step 50)
  * Sync category values:
    * When categories are changed, set `baseMonthlyExpense = Rent + Groceries + Healthcare + Others`.
    * When the total `baseMonthlyExpense` slider is changed, redistribute the difference proportionally or set the others value so the sum remains consistent. (Recommended: update `baseOthers` as the residual difference: `baseOthers = baseMonthlyExpense - Rent - Groceries - Healthcare`, keeping a minimum of 0).

- [ ] **Step 3: Update `InputForm.test.tsx`**
  Align tests with removed fields and verify collapsible category sliders render and synchronize. Run `npx jest src/components/__tests__/InputForm.test.tsx`.

- [ ] **Step 4: Commit**
  Run: `git commit -am "feat: replace global return/inflation with collapsible category sliders inside sidebar"`

---

### Task 4: Hover Explanation Tooltips

**Files:**
* Modify: `src/components/InputForm.tsx`
* Modify: `src/components/AssumptionsPanel.tsx`

- [ ] **Step 1: Create a styled `Tooltip` hover component**
  Define a simple CSS-based hover element next to labels:
  ```tsx
  function HelpIcon({ text }: { text: string }) {
    return (
      <span className="tooltip-trigger" style={{ cursor: 'help', marginLeft: '4px', opacity: 0.6, fontSize: '0.75rem' }}>
        ⓘ
        <span className="tooltip-content">{text}</span>
      </span>
    );
  }
  ```
  Add helper CSS classes in `globals.css` to render a premium styled tooltip bubble on hover.

- [ ] **Step 2: Attach tooltips to all fields**
  Add tooltips for: Current Age, Retirement Age, Current Savings, Monthly Contribution, Base Expense, Rent, Groceries, Healthcare, Germany Benchmarks, India Benchmarks.

- [ ] **Step 3: Commit**
  Run: `git commit -am "feat: implement premium hover tooltips for all settings inputs"`

---

### Task 5: Integration & Wiring

**Files:**
* Modify: `src/app/page.tsx`
* Modify: `src/app/__tests__/page.test.tsx`

- [ ] **Step 1: Initialize states in `src/app/page.tsx`**
  Modify [page.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/app/page.tsx):
  * Initialize default user inputs with category components:
    ```typescript
    baseRent: 1050,
    baseGroceries: 540,
    baseOthers: 1060,
    baseHealthcare: 350,
    baseMonthlyExpense: 3000,
    ```
  * Initialize default assumptions with country investment returns:
    ```typescript
    countryInflation: { Germany: 0.05, India: 0.04 },
    countryInvestmentReturn: { Germany: 0.06, India: 0.08 },
    ```

- [ ] **Step 2: Update all tests & verify production build**
  Run: `npm test && npm run build`
  Expected: PASS all 62+ tests and build successfully.

- [ ] **Step 3: Commit**
  Run: `git commit -am "feat: wire final country return assumptions and category breakdowns"`
