import { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { CalculationResult, UserInputs, City } from '@/types';

interface SingleCityDashboardProps {
  result: CalculationResult;
  userInputs?: UserInputs;
  onUserInputsChange?: (inputs: UserInputs) => void;
  onCityChange?: (city: City) => void;
}

function fmtShort(v: number): string {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
  return `€${v.toFixed(0)}`;
}

function fmtFull(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

const EXPENSE_PALETTE = {
  housing: 'var(--de-color)',
  groceries: 'var(--in-color)',
  healthcare: 'var(--positive)',
  other: 'var(--accent)',
};

export default function SingleCityDashboard({
  result,
  userInputs,
  onUserInputsChange,
  onCityChange,
}: SingleCityDashboardProps) {
  if (!result) return null;

  const {
    city,
    requiredFund,
    projectedFund,
    fundingGap,
    totalMonthlyNeed,
    breakdown,
    requiredSip,
    requiredLumpSum,
    drawdownTimeline,
  } = result;

  const [showIndicesSettings, setShowIndicesSettings] = useState(false);

  const standardAvg = ((userInputs?.baseMonthlyExpense ?? 3000) * city.costOfLivingIndex) / 100;
  const isOverridden = Math.abs(totalMonthlyNeed - standardAvg) > 0.01;
  const diffPct = standardAvg > 0 ? Math.round(((totalMonthlyNeed - standardAvg) / standardAvg) * 100) : 0;

  const handleOverride = (val: number) => {
    if (!userInputs || !onUserInputsChange) return;
    const updatedOverrides = {
      ...(userInputs.cityExpenseOverrides || {}),
      [city.id]: val,
    };
    const updatedCategoryOverrides = { ...(userInputs.cityCategoryOverrides || {}) };
    delete updatedCategoryOverrides[city.id];

    onUserInputsChange({
      ...userInputs,
      cityExpenseOverrides: updatedOverrides,
      cityCategoryOverrides: updatedCategoryOverrides,
    });
  };

  const handleCategoryChange = (key: string, val: number) => {
    if (!userInputs || !onUserInputsChange) return;
    const currentOverrides = userInputs.cityCategoryOverrides?.[city.id] || {};
    
    const rent = key === 'rent' ? val : (currentOverrides.rent ?? breakdown.housing);
    const groceries = key === 'groceries' ? val : (currentOverrides.groceries ?? breakdown.groceries);
    const healthcare = key === 'healthcare' ? val : (currentOverrides.healthcare ?? breakdown.healthcare);
    const others = key === 'others' ? val : (currentOverrides.others ?? breakdown.other);

    const updatedCategoryOverrides = {
      ...(userInputs.cityCategoryOverrides || {}),
      [city.id]: {
        ...currentOverrides,
        [key]: val,
      },
    };

    onUserInputsChange({
      ...userInputs,
      cityCategoryOverrides: updatedCategoryOverrides,
      cityExpenseOverrides: {
        ...(userInputs.cityExpenseOverrides || {}),
        [city.id]: rent + groceries + healthcare + others,
      },
    });
  };

  const handleReset = () => {
    if (!userInputs || !onUserInputsChange) return;
    const updatedOverrides = { ...(userInputs.cityExpenseOverrides || {}) };
    delete updatedOverrides[city.id];
    
    const updatedCategoryOverrides = { ...(userInputs.cityCategoryOverrides || {}) };
    delete updatedCategoryOverrides[city.id];

    onUserInputsChange({
      ...userInputs,
      cityExpenseOverrides: updatedOverrides,
      cityCategoryOverrides: updatedCategoryOverrides,
    });
  };

  const countryFlag = city.country === 'Germany' ? '🇩🇪' : '🇮🇳';
  const countryColor = city.country === 'Germany' ? 'var(--de-color)' : 'var(--in-color)';

  // Prepare Donut Chart Data
  const donutData = [
    { key: 'rent', name: 'Rent/Housing', value: Math.round(breakdown.housing), color: EXPENSE_PALETTE.housing },
    { key: 'groceries', name: 'Groceries', value: Math.round(breakdown.groceries), color: EXPENSE_PALETTE.groceries },
    { key: 'healthcare', name: 'Healthcare', value: Math.round(breakdown.healthcare), color: EXPENSE_PALETTE.healthcare },
    { key: 'others', name: 'Others', value: Math.round(breakdown.other), color: EXPENSE_PALETTE.other },
  ];

  // Custom tooltips
  const renderPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const pct = ((data.value / totalMonthlyNeed) * 100).toFixed(1);
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>
          {data.name}
        </p>
        <p style={{ color: 'var(--accent-light)', fontSize: '0.9rem', fontWeight: 600 }}>
          {fmtFull(data.value)}/mo
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
          {pct}% of budget
        </p>
      </div>
    );
  };

  const renderAreaTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontFamily: 'var(--font-mono)',
          minWidth: '200px',
        }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '8px', letterSpacing: '0.1em' }}>
          AGE {label} ({data.phase.toUpperCase()})
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '3px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', letterSpacing: '0.08em' }}>
            FUND BALANCE
          </span>
          <span style={{ color: 'var(--accent-light)', fontSize: '0.85rem', fontWeight: 500 }}>
            {fmtFull(data.balance)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', letterSpacing: '0.08em' }}>
            CONTRIBUTIONS
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
            {fmtFull(data.netContributions)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      data-testid="single-city-dashboard"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      {/* Header */}
      <div>
        <div
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>Single City Focus</span>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <span style={{ color: countryColor }}>{countryFlag} {city.country}</span>
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.1rem',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {city.name} Detailed Analysis
        </h2>
      </div>

      {/* Hero Stats Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Required Corpus */}
        <div
          data-testid="hero-required-corpus"
          style={{
            padding: '18px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'var(--accent)',
              opacity: 0.65,
            }}
          />
          <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Required Corpus
          </div>
          <div style={{ fontSize: '1.65rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-light)', fontWeight: 500, lineHeight: 1.2 }}>
            {fmtFull(requiredFund)}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '6px', fontFamily: 'var(--font-body)' }}>
            Lump sum needed at retirement Day 1
          </div>
        </div>

        {/* Projected Savings */}
        <div
          data-testid="hero-projected-savings"
          style={{
            padding: '18px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'var(--positive)',
              opacity: 0.65,
            }}
          />
          <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Projected Savings
          </div>
          <div style={{ fontSize: '1.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.2 }}>
            {fmtFull(projectedFund)}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '6px', fontFamily: 'var(--font-body)' }}>
            Expected balance at retirement age
          </div>
        </div>

        {/* Funding Gap */}
        <div
          data-testid="hero-funding-gap"
          style={{
            padding: '18px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: fundingGap > 0 ? 'var(--in-color)' : 'var(--positive)',
              opacity: 0.65,
            }}
          />
          <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Funding Gap
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontFamily: 'var(--font-mono)',
              color: fundingGap > 0 ? 'var(--in-color)' : 'var(--positive)',
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            {fmtFull(fundingGap)}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '6px', fontFamily: 'var(--font-body)' }}>
            {fundingGap > 0 ? 'Shortfall to bridge through saving' : 'Fully funded retirement goal'}
          </div>
        </div>

        {/* Target Savings Rate */}
        <div
          data-testid="hero-target-savings-rate"
          style={{
            padding: '18px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: 'var(--accent)',
              opacity: 0.65,
            }}
          />
          <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Target Savings Rate
          </div>
          <div style={{ fontSize: '1.65rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-light)', fontWeight: 500, lineHeight: 1.2 }}>
            {fmtFull((userInputs?.monthlyContribution ?? 0) + requiredSip)}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', marginTop: '6px', fontFamily: 'var(--font-body)' }}>
            Total monthly investment ongoing forward
          </div>
        </div>
      </div>

      {/* SIP Goal Callout Card */}
      <div
        data-testid="sip-goal-card"
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          border: fundingGap > 0
            ? '1px solid var(--accent)'
            : '1px solid var(--positive)',
          backgroundColor: fundingGap > 0
            ? 'var(--accent-glow)'
            : 'var(--positive-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>{fundingGap > 0 ? '💡' : '🎉'}</span>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 600,
              color: fundingGap > 0 ? 'var(--accent-light)' : 'var(--positive)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {fundingGap > 0 ? 'Actionable SIP Goal' : 'Retirement Plan Status'}
          </span>
        </div>
        <p
          style={{
            fontSize: '0.85rem',
            lineHeight: 1.5,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {fundingGap > 0 ? (
            <>
              To cover your gap of <strong style={{ color: 'var(--accent-light)' }}>{fmtFull(fundingGap)}</strong>, you need to save an additional <strong style={{ color: 'var(--accent-light)' }}>{fmtFull(requiredSip)}/month</strong>—bringing your total target savings rate to <strong style={{ color: 'var(--accent-light)' }}>{fmtFull((userInputs?.monthlyContribution ?? 0) + requiredSip)}/month</strong> (or make a lump sum investment of <strong style={{ color: 'var(--accent-light)' }}>{fmtFull(requiredLumpSum)}</strong> today).
            </>
          ) : (
            <>
              Congratulations! You are on track to meet your retirement goal in <strong style={{ color: 'var(--positive)' }}>{city.name}</strong>. Your current monthly investment of <strong style={{ color: 'var(--positive)' }}>{fmtFull(userInputs?.monthlyContribution ?? 0)}/month</strong> is fully sufficient.
            </>
          )}
        </p>
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Expenses Breakdown Donut Chart */}
        <div
          style={{
            padding: '20px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: '380px',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--text-primary)',
              }}
            >
              Monthly Expenses Breakdown
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                TOTAL BUDGET: €
              </span>
              <input
                data-testid="total-monthly-need-input"
                type="number"
                value={Math.round(totalMonthlyNeed)}
                onChange={e => handleOverride(parseFloat(e.target.value) || 0)}
                disabled={!onUserInputsChange}
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
              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                /mo
              </span>

              {isOverridden && (
                <>
                  <span
                    data-testid="comparison-badge"
                    style={{
                      fontSize: '0.6rem',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '3px 7px',
                      borderRadius: '3px',
                      border: `1px solid ${diffPct > 0 ? 'var(--danger)' : 'var(--positive)'}`,
                      color: diffPct > 0 ? 'var(--danger)' : 'var(--positive)',
                      backgroundColor: diffPct > 0 ? 'var(--danger-bg)' : 'var(--positive-bg)',
                    }}
                  >
                    {diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`} vs average
                  </span>
                  <button
                    onClick={handleReset}
                    style={{
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      padding: 0,
                    }}
                  >
                    Reset to Average
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            data-testid="expenses-donut-chart"
            style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={renderPieTooltip} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                EXPENSES
              </span>
              <span style={{ fontSize: '1.15rem', fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--text-primary)' }}>
                {fmtShort(totalMonthlyNeed)}
              </span>
            </div>
          </div>

          {/* Custom Legend */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 15px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {donutData.map((item, idx) => {
              const pct = ((item.value / (totalMonthlyNeed || 1)) * 100).toFixed(0);
              const isDeHealthcare = city.country === 'Germany' && item.key === 'healthcare';
              
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {item.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        value={isDeHealthcare ? 0 : Math.round(item.value)}
                        disabled={isDeHealthcare || !onUserInputsChange}
                        onChange={e => handleCategoryChange(item.key, parseFloat(e.target.value) || 0)}
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-xs)',
                          color: isDeHealthcare ? 'var(--text-muted)' : 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                          width: '65px',
                          padding: '2px 6px',
                          fontSize: '0.72rem',
                          textAlign: 'right',
                          outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drawdown Timeline Area Chart */}
        <div
          style={{
            padding: '20px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: '380px',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--text-primary)',
              }}
            >
              Savings Drawdown Timeline
            </h3>
            <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', marginTop: '2px' }}>
              ACCUMULATION VS RETIREMENT PHASE
            </p>
          </div>

          <div
            data-testid="drawdown-area-chart"
            style={{ flex: 1, width: '100%', height: '100%', minHeight: '220px' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={drawdownTimeline}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="age"
                  stroke="var(--text-muted)"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={fmtShort}
                />
                <Tooltip content={renderAreaTooltip} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline phase legends */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '2px', backgroundColor: 'var(--accent)' }} />
              <span>Net Fund Balance</span>
            </div>
            <div>
              <span>Peak: {fmtShort(projectedFund)} at age {(() => {
                const retStart = drawdownTimeline.find(d => d.phase === 'Retirement');
                return retStart ? retStart.age - 1 : (drawdownTimeline[drawdownTimeline.length - 1]?.age || '');
              })()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible City Indices & Parameters */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <button
          onClick={() => setShowIndicesSettings(!showIndicesSettings)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontSize: '1.15rem',
            fontStyle: 'italic',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            textAlign: 'left',
            outline: 'none',
          }}
        >
          <span>Edit City Indices & Parameters</span>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            {showIndicesSettings ? '▼ Hide' : '▶ Show'}
          </span>
        </button>

        {showIndicesSettings && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginTop: '10px',
              animation: 'fadeInUp 0.16s ease',
            }}
          >
            <div>
              <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                Cost of Living Index
              </label>
              <input
                type="number"
                value={city.costOfLivingIndex}
                onChange={e => onCityChange?.({ ...city, costOfLivingIndex: parseFloat(e.target.value) || 0 })}
                disabled={!onCityChange}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                Rent Index
              </label>
              <input
                type="number"
                value={city.rentIndex}
                onChange={e => onCityChange?.({ ...city, rentIndex: parseFloat(e.target.value) || 0 })}
                disabled={!onCityChange}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                Groceries Index
              </label>
              <input
                type="number"
                value={city.groceriesIndex}
                onChange={e => onCityChange?.({ ...city, groceriesIndex: parseFloat(e.target.value) || 0 })}
                disabled={!onCityChange}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
