'use client';

import React from 'react';
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
  Legend,
} from 'recharts';
import { CalculationResult } from '@/types';

interface SingleCityDashboardProps {
  result: CalculationResult;
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
  housing: '#5090D4',   // Rent/Housing - German blue color
  groceries: '#E08A68', // Groceries - India orange color
  healthcare: '#4A9068',// Healthcare - Positive green color
  other: '#B89450',     // Others - Accent gold color
};

export default function SingleCityDashboard({ result }: SingleCityDashboardProps) {
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

  const countryFlag = city.country === 'Germany' ? '🇩🇪' : '🇮🇳';
  const countryColor = city.country === 'Germany' ? 'var(--de-color)' : 'var(--in-color)';

  // Prepare Donut Chart Data
  const donutData = [
    { name: 'Rent/Housing', value: Math.round(breakdown.housing), color: EXPENSE_PALETTE.housing },
    { name: 'Groceries', value: Math.round(breakdown.groceries), color: EXPENSE_PALETTE.groceries },
    { name: 'Healthcare', value: Math.round(breakdown.healthcare), color: EXPENSE_PALETTE.healthcare },
    { name: 'Others', value: Math.round(breakdown.other), color: EXPENSE_PALETTE.other },
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
              backgroundColor: fundingGap > 0 ? '#D47050' : 'var(--positive)',
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
              color: fundingGap > 0 ? '#D47050' : 'var(--positive)',
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
              To cover your gap of <strong style={{ color: 'var(--accent-light)' }}>{fmtFull(fundingGap)}</strong>, you need to save an additional <strong style={{ color: 'var(--accent-light)' }}>{fmtFull(requiredSip)}/month</strong> (or make a lump sum investment of <strong style={{ color: 'var(--accent-light)' }}>{fmtFull(requiredLumpSum)}</strong> today).
            </>
          ) : (
            <>
              Congratulations! You are on track to meet your retirement goal in <strong style={{ color: 'var(--positive)' }}>{city.name}</strong>. You do not have a funding gap.
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
            <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', marginTop: '2px' }}>
              TOTAL BUDGET: {fmtFull(totalMonthlyNeed)}/mo
            </p>
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
              const pct = ((item.value / totalMonthlyNeed) * 100).toFixed(0);
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {fmtFull(item.value)} ({pct}%)
                    </span>
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
    </div>
  );
}
