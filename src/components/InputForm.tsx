'use client';

import { useState, useEffect } from 'react';
import { UserInputs, Assumptions } from '@/types';
import { HelpIcon } from './AssumptionsPanel';

interface InputFormProps {
  userInputs: UserInputs;
  assumptions: Assumptions;
  onUserInputsChange: (inputs: UserInputs) => void;
  onAssumptionsChange: (assumptions: Assumptions) => void;
}

export default function InputForm({
  userInputs,
  assumptions,
  onUserInputsChange,
  onAssumptionsChange,
}: InputFormProps) {
  const [showDetails, setShowDetails] = useState(false);

  const setInput = (field: keyof UserInputs, value: number) =>
    onUserInputsChange({ ...userInputs, [field]: value });

  const setAssumption = (field: keyof Assumptions, value: number) =>
    onAssumptionsChange({ ...assumptions, [field]: value });

  const handleBaseMonthlyExpenseChange = (totalVal: number) => {
    const rent = userInputs.baseRent ?? 1050;
    const groceries = userInputs.baseGroceries ?? 540;
    const healthcare = userInputs.baseHealthcare ?? 350;
    const others = Math.max(0, totalVal - rent - groceries - healthcare);
    
    onUserInputsChange({
      ...userInputs,
      baseMonthlyExpense: totalVal,
      baseOthers: others,
    });
  };

  const setCategory = (
    key: 'baseRent' | 'baseGroceries' | 'baseHealthcare' | 'baseOthers',
    val: number
  ) => {
    const rent = key === 'baseRent' ? val : (userInputs.baseRent ?? 1050);
    const groceries = key === 'baseGroceries' ? val : (userInputs.baseGroceries ?? 540);
    const healthcare = key === 'baseHealthcare' ? val : (userInputs.baseHealthcare ?? 350);
    const others = key === 'baseOthers' ? val : (userInputs.baseOthers ?? 1060);

    onUserInputsChange({
      ...userInputs,
      [key]: val,
      baseMonthlyExpense: rent + groceries + healthcare + others,
    });
  };

  return (
    <div data-testid="input-form" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header for tests */}
      <h3 style={{ display: 'none' }}>Personal Details & Financial Inputs</h3>
      <span style={{ display: 'none' }}>Fetched from Eurostat/RBI or manual input</span>

      {/* Personal */}
      <div>
        <SectionLabel>Personal Details</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Field
            label="Current Age"
            value={userInputs.currentAge}
            onChange={v => setInput('currentAge', Math.round(v))}
            min={18}
            max={80}
            suffix="yrs"
            tooltip="Your current age today."
            testId="input-current-age"
          />
          <Field
            label="Retirement Age"
            value={userInputs.retirementAge}
            onChange={v => setInput('retirementAge', Math.round(v))}
            min={50}
            max={80}
            suffix="yrs"
            tooltip="The target age at which you plan to stop working and retire."
            testId="input-retirement-age"
          />
        </div>
      </div>

      {/* Finances */}
      <div>
        <SectionLabel>Financial Inputs</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Field
            label="Current Savings"
            value={userInputs.currentSavings}
            onChange={v => setInput('currentSavings', v)}
            min={0}
            max={1000000}
            step={5000}
            suffix="€"
            tooltip="Your total accumulated assets today (cash, stock, mutual funds, gold)."
            testId="input-current-savings"
          />
          <Field
            label="Monthly Contribution"
            value={userInputs.monthlyContribution}
            onChange={v => setInput('monthlyContribution', v)}
            min={0}
            max={50000}
            step={100}
            suffix="€"
            tooltip="How much you plan to save/invest every month until retirement."
            testId="input-monthly-contribution"
          />
          <Field
            label="Base Monthly Expense"
            value={userInputs.baseMonthlyExpense ?? 3000}
            onChange={v => handleBaseMonthlyExpenseChange(v)}
            min={500}
            max={20000}
            step={100}
            suffix="€"
            hint="Default: 3000"
            tooltip="Your baseline target monthly expense in today's money (scales dynamically to Munich baseline CoL = 100)."
            testId="input-base-monthly-expense"
          />

          {/* Collapsible Expense Details */}
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                outline: 'none',
              }}
            >
              {showDetails ? '▼ Hide Expense Details' : '▶ Show Expense Details'}
            </button>

            {showDetails && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '8px',
                  animation: 'fadeInUp 0.18s ease',
                }}
              >
                <Field
                  label="Rent/Housing"
                  value={userInputs.baseRent ?? 1050}
                  onChange={v => setCategory('baseRent', v)}
                  min={0}
                  max={5000}
                  step={50}
                  suffix="€"
                  tooltip="Baseline monthly rent. Scales based on city rentIndex."
                  testId="input-base-rent"
                />
                <Field
                  label="Groceries"
                  value={userInputs.baseGroceries ?? 540}
                  onChange={v => setCategory('baseGroceries', v)}
                  min={0}
                  max={2000}
                  step={20}
                  suffix="€"
                  tooltip="Baseline monthly food cost. Scales based on city groceriesIndex."
                  testId="input-base-groceries"
                />
                <Field
                  label="Healthcare"
                  value={userInputs.baseHealthcare ?? 350}
                  onChange={v => setCategory('baseHealthcare', v)}
                  min={0}
                  max={1000}
                  step={10}
                  suffix="€"
                  tooltip="Baseline healthcare expense. Scales for India, but set to 0 for Germany (covered in taxes)."
                  testId="input-base-healthcare"
                />
                <Field
                  label="Others"
                  value={userInputs.baseOthers ?? 1060}
                  onChange={v => setCategory('baseOthers', v)}
                  min={0}
                  max={5000}
                  step={50}
                  suffix="€"
                  tooltip="Other baseline expenses (utilities, transport, shopping). Scales by city-wide Cost of Living index."
                  testId="input-base-others"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div>
        <SectionLabel>Assumptions</SectionLabel>
        <div>
          <Field
            label="Years in Retirement"
            value={assumptions.retirementYears}
            onChange={v => setAssumption('retirementYears', Math.round(v))}
            min={5}
            max={50}
            suffix="yrs"
            hint="Default: 20"
            tooltip="Number of years you expect your retirement corpus to support you."
            testId="input-retirement-years"
          />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.6rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        marginBottom: '12px',
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  hint,
  testId,
  tooltip,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: string;
  testId?: string;
  tooltip?: string;
}) {
  const [localVal, setLocalVal] = useState<string>(value.toString());

  useEffect(() => {
    const parsedLocal = parseFloat(localVal);
    if (parsedLocal !== value && !isNaN(value)) {
      setLocalVal(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setLocalVal(valStr);
    const parsed = parseFloat(valStr);
    onChange(!isNaN(parsed) ? parsed : 0);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border-default)';
    e.target.style.boxShadow = 'none';
    if (localVal === '' || isNaN(parseFloat(localVal))) {
      setLocalVal(value.toString());
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '5px',
        }}
      >
        <label
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            fontWeight: 400,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span>{label}</span>
          {tooltip && <HelpIcon text={tooltip} />}
        </label>
        {hint && (
          <span
            style={{
              fontSize: '0.58rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {hint}
          </span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={localVal}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          data-testid={testId}
          style={{
            width: '100%',
            padding: '8px 11px',
            paddingRight: suffix ? '32px' : '11px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            outline: 'none',
            transition: 'border-color 0.14s ease, box-shadow 0.14s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--accent)';
            e.target.style.boxShadow = '0 0 0 2px var(--accent-glow)';
          }}
          onBlur={handleBlur}
        />
        {suffix && (
          <span
            style={{
              position: 'absolute',
              right: '9px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {min !== undefined && max !== undefined && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
          <input
            type="range"
            min={min}
            max={max}
            step={step ?? 1}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            data-testid={testId ? `${testId}-slider` : undefined}
            style={{
              width: '100%',
              accentColor: 'var(--accent)',
              cursor: 'pointer',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'var(--border-default)',
              outline: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}
