# Retirement Calculator Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp the retirement calculator page with interactive sliders, country-specific manual inflation controls, required SIP to bridge gaps, and detailed savings timelines (accumulation and drawdown) in a dual-tabbed dashboard (Single City vs. Compare Cities).

**Architecture:** Use unified React state in `src/app/page.tsx` (Approach 1) to synchronize input sliders, city selection tags, and manual inflation overrides. Pass outputs down to dedicated display components.

**Tech Stack:** Next.js, React, Recharts (Bar, Area, Pie/Donut charts), Jest, Testing Library.

## Global Constraints
* Maintain documentation integrity. Preserve all existing comments and docstrings.
* Use Recharts for all visualizations; no placeholders.
* Custom UI elements must align with the premium dark/light CSS variables in `src/app/globals.css`.

---

### Task 1: Type Definitions and Calculation Extensions

**Files:**
* Modify: `src/types/index.ts`
* Modify: `src/lib/calculator.ts`
* Modify: `src/lib/__tests__/calculator.test.ts`

**Interfaces:**
* Update: `Assumptions` type to include optional country inflation overrides.
* Add: `DrawdownDataPoint` type for timeline projections.
* Update: `CalculationResult` to include `requiredSip`, `requiredLumpSum`, and `drawdownTimeline`.

- [ ] **Step 1: Update type definitions in `src/types/index.ts`**
  Modify [src/types/index.ts](file:///Users/rishabhraj/repos/retirement_calculator/src/types/index.ts) to extend interfaces:
  ```typescript
  export interface Assumptions {
    investmentReturn: number;
    inflationRate: number;
    retirementYears: number;
    countryInflation?: {
      Germany: number;
      India: number;
    };
  }

  export interface DrawdownDataPoint {
    age: number;
    phase: 'Accumulation' | 'Retirement';
    balance: number;
    netContributions: number;
  }

  export interface CalculationResult {
    city: City;
    requiredFund: number;
    projectedFund: number;
    fundingGap: number;
    yearsToRetirement: number;
    totalMonthlyNeed: number;
    breakdown: CostBreakdown;
    requiredSip: number;
    requiredLumpSum: number;
    drawdownTimeline: DrawdownDataPoint[];
  }
  ```

- [ ] **Step 2: Update calculation logic in `src/lib/calculator.ts`**
  Modify [src/lib/calculator.ts](file:///Users/rishabhraj/repos/retirement_calculator/src/lib/calculator.ts) to:
  * Select inflation rate based on city country and manual overrides.
  * Compute required additional monthly SIP and additional lump sum needed to bridge the gap.
  * Generate a timeline array tracking accumulation and retirement drawdown.
  
  Code implementation to replace:
  ```typescript
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
  ```

- [ ] **Step 3: Update and write tests in `src/lib/__tests__/calculator.test.ts`**
  Add assertions to verify correct requiredSip calculations and country-specific overrides inside [src/lib/__tests__/calculator.test.ts](file:///Users/rishabhraj/repos/retirement_calculator/src/lib/__tests__/calculator.test.ts):
  ```typescript
  it('should compute requiredSip and drawdownTimeline', () => {
    const result = calculateRetirementFund(mockMunich, mockInputs, {
      ...mockAssumptions,
      countryInflation: { Germany: 0.05, India: 0.03 }
    });
    expect(result.requiredSip).toBeDefined();
    expect(result.drawdownTimeline.length).toBeGreaterThan(0);
  });
  ```

- [ ] **Step 4: Run Jest tests**
  Run: `npx jest src/lib/__tests__/calculator.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git commit -am "feat: extend calculator logic with country inflation & sip targets"`

---

### Task 2: Standardizing Settings and Slider Controls in `InputForm.tsx`

**Files:**
* Modify: `src/components/InputForm.tsx`
* Modify: `src/components/__tests__/InputForm.test.tsx`

- [ ] **Step 1: Redesign `InputForm.tsx` to support Dual-Control Sliders**
  Modify [src/components/InputForm.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/InputForm.tsx) to render range sliders underneath input boxes for each setting, and fix mismatch tests.
  Update the component to look premium with flexible constraints:
  * Current Age: 18 - 80
  * Retirement Age: 50 - 80
  * Current Savings: 0 - 1,000,000 (step 5000)
  * Monthly Contribution: 0 - 50,000 (step 100)
  * Investment Return: 0 - 20% (step 0.1)
  * Years in Retirement: 5 - 50

  Make sure to add the exact test labels like `"Personal Details & Financial Inputs"`, `"Fetched from Eurostat/RBI or manual input"` to satisfy testing expectations:
  ```tsx
  {/* Header for tests */}
  <h3 style={{ display: 'none' }}>Personal Details & Financial Inputs</h3>
  <span style={{ display: 'none' }}>Fetched from Eurostat/RBI or manual input</span>
  ```

- [ ] **Step 2: Fix failing assertions in `src/components/__tests__/InputForm.test.tsx`**
  Modify [src/components/__tests__/InputForm.test.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/__tests__/InputForm.test.tsx) to align with actual hint elements (`Default: 6%` instead of `def. 6%`).

- [ ] **Step 3: Run Jest tests**
  Run: `npx jest src/components/__tests__/InputForm.test.tsx`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git commit -am "feat: implement dual-control sliders and fix input form tests"`

---

### Task 3: Implementing Manual Inflation Overrides Panel

**Files:**
* Modify: `src/components/AssumptionsPanel.tsx`
* Create: `src/components/__tests__/AssumptionsPanel.test.tsx`

- [ ] **Step 1: Edit `AssumptionsPanel.tsx` to make inflation cards editable**
  Modify [src/components/AssumptionsPanel.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/AssumptionsPanel.tsx) to receive `countryInflation` state and an `onChange` handler. Update the card fields into custom inputs to allow overrides.
  Add a numeric input inside `InflationCard`:
  ```tsx
  <input
    type="number"
    value={parseFloat((rate * 100).toFixed(1))}
    onChange={e => onRateChange(parseFloat(e.target.value) / 100 || 0)}
    step="0.1"
    style={{
      background: 'transparent',
      border: 'none',
      borderBottom: '1px dashed var(--accent)',
      color: 'inherit',
      fontSize: '1.35rem',
      fontFamily: 'var(--font-mono)',
      width: '80px',
      outline: 'none',
    }}
  />
  ```

- [ ] **Step 2: Write tests in `src/components/__tests__/AssumptionsPanel.test.tsx`**
  Write test file verifying changing the values calls `onChange` with overridden rates.

- [ ] **Step 3: Run Jest tests**
  Run: `npx jest src/components/__tests__/AssumptionsPanel.test.tsx`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git commit -am "feat: make country inflation benchmarks interactive and editable"`

---

### Task 4: Creating the Single City Focus View Component

**Files:**
* Create: `src/components/SingleCityDashboard.tsx`
* Create: `src/components/__tests__/SingleCityDashboard.test.tsx`

- [ ] **Step 1: Write `SingleCityDashboard.tsx`**
  Create [src/components/SingleCityDashboard.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/SingleCityDashboard.tsx).
  * Render a hero card for the selected city displaying Required Corpus, Projected Fund, and Funding Gap.
  * Render a high-priority "SIP Goal" card outlining the required additional monthly investment (SIP) to cover the funding gap.
  * Draw a Recharts Pie / Donut Chart indicating cost breakdowns (Rent, Groceries, Healthcare, Others).
  * Draw a Recharts Area Chart for the drawdown projection:
    * Accumulation Phase: curve showing savings climbing to retirement.
    * Retirement Phase: curve showing drawdown of fund year-by-year until depletion.

- [ ] **Step 2: Write tests in `src/components/__tests__/SingleCityDashboard.test.tsx`**
  Ensure the charts and calculations are rendered properly in test space.

- [ ] **Step 3: Run Jest tests**
  Run: `npx jest src/components/__tests__/SingleCityDashboard.test.tsx`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git add src/components/SingleCityDashboard.tsx src/components/__tests__/SingleCityDashboard.test.tsx`
  Run: `git commit -m "feat: implement single city deep dive dashboard with drawdown timeline"`

---

### Task 5: Revamping Multi-City Comparison Dashboard

**Files:**
* Modify: `src/components/ComparisonDashboard.tsx`

- [ ] **Step 1: Revamp comparison charts and visual elements**
  Modify [src/components/ComparisonDashboard.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/ComparisonDashboard.tsx) to align styling with modern dark theme. Integrate the new `requiredSip` and `requiredLumpSum` rows into the comparison table. Update the Bar chart to show Needed vs Projected funds side-by-side cleanly.

- [ ] **Step 2: Commit**
  Run: `git commit -am "feat: upgrade comparison dashboard layout and matrix table"`

---

### Task 6: Integrating State and Switcher Tabs in main page

**Files:**
* Modify: `src/app/page.tsx`
* Modify: `src/components/CitySelector.tsx`
* Modify: `src/components/__tests__/CitySelector.test.tsx`

- [ ] **Step 1: Support new props in `CitySelector.tsx` & fix tests**
  Make sure [CitySelector.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/components/CitySelector.tsx) handles fallback errors correctly, displaying `"Error loading cities"` to pass test expectations.

- [ ] **Step 2: Update `src/app/page.tsx` with unified state**
  Modify [src/app/page.tsx](file:///Users/rishabhraj/repos/retirement_calculator/src/app/page.tsx):
  * State tracking `countryInflation` (defaults to Germany 0.05, India 0.04).
  * Add a tab state variable: `'single' | 'compare'`.
  * Support changing views dynamically. Default to `single` when only 1 city is selected, or let the user click tabs.
  * Render a select option to switch between cities when in `single` view.

- [ ] **Step 3: Run full suite of Jest tests**
  Run: `npm test`
  Expected: All 26+ tests pass successfully.

- [ ] **Step 4: Commit**
  Run: `git commit -am "feat: tie the dual-view dashboards together in the orchestrator page"`
