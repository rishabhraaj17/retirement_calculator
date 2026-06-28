# Custom Monthly Expenses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to input their own custom monthly expenses globally (via sidebar slider) and override them on a per-city basis (inside dashboards and tables), with visual comparison banners showing deviation against standard scaled averages.

**Architecture:** Extend unified React state in `src/app/page.tsx` with `baseMonthlyExpense` and `cityExpenseOverrides`. Propagate parameters to the calculator logic and display edit controls in Single City and Compare matrix views.

**Tech Stack:** React, Next.js, Jest, Testing Library.

## Global Constraints
* Maintain documentation integrity. Preserve all existing comments and docstrings.
* Visual indicators must align with light/dark CSS variables.
* Run full test suite at completion of each task.

---

### Task 1: Type Definitions and Calculator Extension

**Files:**
* Modify: `src/types/index.ts`
* Modify: `src/lib/calculator.ts`
* Modify: `src/lib/__tests__/calculator.test.ts`

**Interfaces:**
* Update: `UserInputs` to support `baseMonthlyExpense?: number` and `cityExpenseOverrides?: Record<string, number>`.

- [ ] **Step 1: Update type definitions in `src/types/index.ts`**
  Modify [src/types/index.ts](file:///Users/rishabhraj/repos/retirement_calculator/src/types/index.ts) to extend `UserInputs`:
  ```typescript
  export interface UserInputs {
    currentAge: number;
    retirementAge: number;
    currentSavings: number;
    monthlyContribution: number;
    baseMonthlyExpense?: number;
    cityExpenseOverrides?: Record<string, number>;
  }
  ```

- [ ] **Step 2: Update calculation logic in `src/lib/calculator.ts`**
  Modify [src/lib/calculator.ts](file:///Users/rishabhraj/repos/retirement_calculator/src/lib/calculator.ts):
  Update `calculateRetirementFund` to read inputs for overrides:
  ```typescript
  export function calculateRetirementFund(
    city: City,
    inputs: UserInputs,
    assumptions: Assumptions
  ): CalculationResult {
    const inflation = assumptions.countryInflation
      ? (city.country === 'Germany'
          ? assumptions.countryInflation.Germany
          : (city.country === 'India' ? assumptions.countryInflation.India : assumptions.inflationRate))
      : assumptions.inflationRate;

    // Monthly expenses in today's money, scaled by city cost-of-living
    const baseMonthlyExpense = inputs.baseMonthlyExpense ?? 3000;
    const monthlyExpenses = inputs.cityExpenseOverrides?.[city.id] !== undefined
      ? (inputs.cityExpenseOverrides[city.id] || 0)
      : (baseMonthlyExpense * city.costOfLivingIndex) / 100;

    // Cost breakdown using realistic budget proportions
    const housing = monthlyExpenses * 0.35;
    const groceries = monthlyExpenses * 0.18;
    const healthcare = city.healthcareCostMonthly;
    const other = Math.max(0, monthlyExpenses - housing - groceries - healthcare);
    const breakdown: CostBreakdown = { monthlyExpenses, housing, groceries, healthcare, other };

    // Total lump sum needed on retirement day 1
    const requiredFund = calculatePresentValue(
      monthlyExpenses,
      inflation,
      assumptions.investmentReturn,
      assumptions.retirementYears
    );
    // ... rest of calculations remain unchanged ...
  ```

- [ ] **Step 3: Write unit tests in `src/lib/__tests__/calculator.test.ts`**
  Add assertions inside [src/lib/__tests__/calculator.test.ts](file:///Users/rishabhraj/repos/retirement_calculator/src/lib/__tests__/calculator.test.ts) to verify custom global base and city overrides:
  ```typescript
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
  ```

- [ ] **Step 4: Run Jest tests**
  Run: `npx jest src/lib/__tests__/calculator.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git commit -am "feat: extend calculator logic for custom expenses & overrides"`

---

### Task 2: Adding Global Expense Slider in Settings Sidebar

**Files:**
* Modify: `src/components/InputForm.tsx`
* Modify: `src/components/__tests__/InputForm.test.tsx`

- [ ] **Step 1: Edit `InputForm.tsx` to render Base Monthly Expense slider**
  Modify [src/components/InputForm.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/InputForm.tsx):
  Add a slider under "Finances" section:
  ```tsx
  <Field
    label="Base Monthly Expense"
    value={userInputs.baseMonthlyExpense ?? 3000}
    onChange={v => setInput('baseMonthlyExpense', v)}
    min={500}
    max={20000}
    step={100}
    suffix="€"
    hint="Default: 3000"
    testId="input-base-monthly-expense"
  />
  ```

- [ ] **Step 2: Add assertions to `src/components/__tests__/InputForm.test.tsx`**
  Add a test to verify rendering and change tracking of this new field.

- [ ] **Step 3: Run Jest tests**
  Run: `npx jest src/components/__tests__/InputForm.test.tsx`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git commit -am "feat: add global monthly expense slider to InputForm"`

---

### Task 3: Interactive Override Control in Single City Focus View

**Files:**
* Modify: `src/components/SingleCityDashboard.tsx`
* Modify: `src/components/__tests__/SingleCityDashboard.test.tsx`

**Interfaces:**
* Update: `SingleCityDashboardProps` to accept `userInputs: UserInputs` and `onUserInputsChange: (inputs: UserInputs) => void`.

- [ ] **Step 1: Upgraded SingleCityDashboard input and comparison logic**
  Modify [src/components/SingleCityDashboard.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/SingleCityDashboard.tsx) to accept updated props.
  * Render an editable number input for monthly expenses:
  ```tsx
  <input
    type="number"
    value={Math.round(totalMonthlyNeed)}
    onChange={e => handleOverride(parseFloat(e.target.value) || 0)}
    style={{
      backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xs)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-mono)',
      width: '100px',
      padding: '4px 8px',
      fontSize: '0.85rem'
    }}
  />
  ```
  * Calculate standard average: `const standardAvg = ((userInputs.baseMonthlyExpense ?? 3000) * city.costOfLivingIndex) / 100;`
  * If overridden, render comparison indicator: `const diffPct = Math.round(((totalMonthlyNeed - standardAvg) / standardAvg) * 100);`
    * Show badge: `+12% vs average` (or `-8% vs average`) in red/green respectively.
    * Provide a Reset button to clear override:
    ```tsx
    <button onClick={handleReset} style={{ color: 'var(--accent)', cursor: 'pointer', background: 'transparent', border: 'none', fontSize: '0.7rem' }}>
      Reset to Average
    </button>
    ```

- [ ] **Step 2: Update tests in `SingleCityDashboard.test.tsx`**
  Assert override input is present, fires change handler, and exhibits correct comparison calculations.

- [ ] **Step 3: Run Jest tests**
  Run: `npx jest src/components/__tests__/SingleCityDashboard.test.tsx`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git commit -am "feat: support custom overrides and comparison indicators in SingleCityDashboard"`

---

### Task 4: Inline Matrix Overrides in Comparison Dashboard

**Files:**
* Modify: `src/components/ComparisonDashboard.tsx`
* Modify: `src/components/__tests__/ComparisonDashboard.test.tsx`

**Interfaces:**
* Update: `ComparisonDashboardProps` to accept `userInputs: UserInputs` and `onUserInputsChange: (inputs: UserInputs) => void`.

- [ ] **Step 1: Upgraded ComparisonDashboard Table row to render inputs**
  Modify [src/components/ComparisonDashboard.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/ComparisonDashboard.tsx):
  * For the "Monthly Need" cell inside the table row, render an input element allowing the user to override expenses directly inside the comparison grid.
  * When input changes, update `cityExpenseOverrides` in `userInputs` and call `onUserInputsChange`.

- [ ] **Step 2: Update tests in `ComparisonDashboard.test.tsx`**
  Verify table input rendering and updates.

- [ ] **Step 3: Run Jest tests**
  Run: `npx jest src/components/__tests__/ComparisonDashboard.test.tsx`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git commit -am "feat: support inline cell updates for monthly needs in comparison table"`

---

### Task 5: Main Orchestrator Integration & Handoff

**Files:**
* Modify: `src/app/page.tsx`
* Modify: `src/app/__tests__/page.test.tsx`

- [ ] **Step 1: Wire unified state handlers in `src/app/page.tsx`**
  Modify [src/app/page.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/app/page.tsx) to ensure new properties are initialised in state and passed correctly to child components (`SingleCityDashboard`, `ComparisonDashboard`).

- [ ] **Step 2: Run all tests & verify production build**
  Run: `npm test && npm run build`
  Expected: All 51+ tests pass and application compiles.

- [ ] **Step 3: Commit**
  Run: `git commit -am "feat: wire unified state and finalize custom monthly expenses overrides"`
