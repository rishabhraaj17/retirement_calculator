'use client';

import { UserInputs, Assumptions } from '@/types';

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
  const setInput = (field: keyof UserInputs, value: number) =>
    onUserInputsChange({ ...userInputs, [field]: value });

  const setAssumption = (field: keyof Assumptions, value: number) =>
    onAssumptionsChange({ ...assumptions, [field]: value });

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
            testId="input-current-age"
          />
          <Field
            label="Retirement Age"
            value={userInputs.retirementAge}
            onChange={v => setInput('retirementAge', Math.round(v))}
            min={50}
            max={80}
            suffix="yrs"
            testId="input-retirement-age"
          />
        </div>
      </div>

      {/* Finances */}
      <div>
        <SectionLabel>Financial Inputs</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Field
            label="Current Savings"
            value={userInputs.currentSavings}
            onChange={v => setInput('currentSavings', v)}
            min={0}
            max={1000000}
            step={5000}
            suffix="€"
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
            testId="input-monthly-contribution"
          />
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
        </div>
      </div>

      {/* Assumptions */}
      <div>
        <SectionLabel>Assumptions</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Field
            label="Investment Return"
            value={parseFloat((assumptions.investmentReturn * 100).toFixed(1))}
            onChange={v => setAssumption('investmentReturn', v / 100)}
            min={0}
            max={20}
            step={0.1}
            suffix="%"
            hint="Default: 6%"
            testId="input-investment-return"
          />
          <Field
            label="Inflation Rate"
            value={parseFloat((assumptions.inflationRate * 100).toFixed(1))}
            onChange={v => setAssumption('inflationRate', v / 100)}
            min={0}
            max={20}
            step={0.1}
            suffix="%"
            hint="Default: 4%"
            testId="input-inflation-rate"
          />
          <Field
            label="Years in Retirement"
            value={assumptions.retirementYears}
            onChange={v => setAssumption('retirementYears', Math.round(v))}
            min={5}
            max={50}
            suffix="yrs"
            hint="Default: 20"
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
}) {
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
          }}
        >
          {label}
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
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
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
          onBlur={e => {
            e.target.style.borderColor = 'var(--border-default)';
            e.target.style.boxShadow = 'none';
          }}
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

