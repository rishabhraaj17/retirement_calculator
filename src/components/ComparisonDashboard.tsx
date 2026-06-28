'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CalculationResult } from '@/types';

interface ComparisonDashboardProps {
  results: CalculationResult[];
}

const CITY_PALETTE: Record<string, string> = {
  Munich: '#4E90D4',
  Berlin: '#72AEDD',
  'Delhi NCR': '#D47050',
  Mumbai: '#E08A68',
  Bangalore: '#C86042',
};

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        fontFamily: 'var(--font-mono)',
        minWidth: '180px',
      }}
    >
      <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '8px', letterSpacing: '0.1em' }}>
        {label}
      </p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '3px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', letterSpacing: '0.08em' }}>
            {p.dataKey === 'required' ? 'NEEDED' : 'PROJECTED'}
          </span>
          <span style={{ color: p.dataKey === 'required' ? 'var(--accent-light)' : 'var(--positive)', fontSize: '0.82rem', fontWeight: 500 }}>
            {fmtFull(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ComparisonDashboard({ results }: ComparisonDashboardProps) {
  if (results.length === 0) {
    return (
      <div
        data-testid="comparison-dashboard-empty"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '68vh',
          textAlign: 'center',
          gap: '18px',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          +
        </div>
        <div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--text-primary)',
              marginBottom: '8px',
              lineHeight: 1.2,
            }}
          >
            Select cities to begin
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
            }}
          >
            Choose one or more cities from the panel to model your retirement fund
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginTop: '4px',
          }}
        >
          {['🇩🇪 Munich', '🇩🇪 Berlin', '🇮🇳 Delhi NCR', '🇮🇳 Mumbai', '🇮🇳 Bangalore'].map(city => (
            <span
              key={city}
              style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '3px 8px',
              }}
            >
              {city}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const sorted = [...results].sort((a, b) => b.requiredFund - a.requiredFund);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const potentialSavings = results.length > 1 ? highest.requiredFund - lowest.requiredFund : null;

  const chartData = results.map(r => ({
    city: r.city.name,
    required: r.requiredFund,
    projected: r.projectedFund,
    fill: CITY_PALETTE[r.city.name] ?? '#888',
  }));

  const tableRows: {
    key: string;
    label: string;
    getValue: (r: CalculationResult) => number;
    highlight?: boolean;
    positive?: boolean;
    danger?: boolean;
  }[] = [
    { key: 'totalMonthlyNeed', label: 'Monthly Need', getValue: (r) => r.totalMonthlyNeed },
    { key: 'housing', label: 'Housing', getValue: (r) => r.breakdown.housing },
    { key: 'groceries', label: 'Groceries', getValue: (r) => r.breakdown.groceries },
    { key: 'healthcare', label: 'Healthcare', getValue: (r) => r.breakdown.healthcare },
    { key: 'other', label: 'Other', getValue: (r) => r.breakdown.other },
    { key: 'requiredFund', label: 'Total Needed', getValue: (r) => r.requiredFund, highlight: true },
    { key: 'projectedFund', label: 'Projected', getValue: (r) => r.projectedFund, positive: true },
    { key: 'fundingGap', label: 'Funding Gap', getValue: (r) => r.fundingGap, danger: true },
  ];

  return (
    <div
      data-testid="comparison-dashboard"
      style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeInUp 0.3s ease' }}
    >
      {/* Page header */}
      <div>
        <div
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '6px',
          }}
        >
          Retirement Fund Model
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
          {results.length === 1
            ? `${results[0].city.name} Analysis`
            : `${results.length}-City Comparison`}
        </h2>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(results.length, 3)}, 1fr)`,
          gap: '14px',
        }}
      >
        {results.map(result => {
          const isHigh = result === highest && results.length > 1;
          const isLow = result === lowest && results.length > 1;
          const cityColor = CITY_PALETTE[result.city.name] ?? '#888';
          const countryColor = result.city.country === 'Germany' ? 'var(--de-color)' : 'var(--in-color)';

          return (
            <div
              key={result.city.id}
              style={{
                padding: '18px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top accent bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: cityColor,
                  opacity: 0.65,
                }}
              />

              {/* Badge */}
              {(isHigh || isLow) && (
                <div
                  style={{
                    position: 'absolute',
                    top: '13px',
                    right: '13px',
                    fontSize: '0.55rem',
                    fontFamily: 'var(--font-mono)',
                    color: isLow ? 'var(--positive)' : 'var(--accent)',
                    border: `1px solid ${isLow ? 'rgba(74,144,104,0.35)' : 'var(--accent-glow)'}`,
                    borderRadius: '3px',
                    padding: '2px 5px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {isLow ? 'Lowest' : 'Highest'}
                </div>
              )}

              {/* Country */}
              <div
                style={{
                  fontSize: '0.58rem',
                  fontFamily: 'var(--font-mono)',
                  color: countryColor,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '3px',
                  opacity: 0.7,
                }}
              >
                {result.city.country === 'Germany' ? '🇩🇪' : '🇮🇳'} {result.city.country}
              </div>

              {/* City name */}
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: '1.05rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  marginBottom: '14px',
                }}
              >
                {result.city.name}
              </div>

              {/* Required fund */}
              <div style={{ marginBottom: '10px' }}>
                <div
                  style={{
                    fontSize: '0.55rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: '3px',
                  }}
                >
                  Total Fund Needed
                </div>
                <div
                  style={{
                    fontSize: '1.65rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-light)',
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {fmtShort(result.requiredFund)}
                </div>
              </div>

              {/* Projected fund + funding status */}
              <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '3px' }}>
                    Projected at Retirement
                  </div>
                  <div style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1 }}>
                    {fmtShort(result.projectedFund)}
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.6rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '3px 7px',
                    borderRadius: '3px',
                    ...(result.fundingGap === 0
                      ? { color: 'var(--positive)', border: '1px solid rgba(74,144,104,0.35)', backgroundColor: 'var(--positive-bg)' }
                      : { color: '#D47050', border: '1px solid rgba(212,112,80,0.3)', backgroundColor: 'rgba(212,112,80,0.06)' }),
                  }}
                >
                  {result.fundingGap === 0
                    ? 'Funded'
                    : `−${fmtShort(result.fundingGap)}`}
                </div>
              </div>

              {/* Secondary metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <Metric label="Monthly Need" value={fmtFull(result.totalMonthlyNeed)} />
                <Metric label="Healthcare/mo" value={fmtFull(result.breakdown.healthcare)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Savings insight */}
      {potentialSavings !== null && potentialSavings > 0 && (
        <div
          style={{
            padding: '13px 18px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(74, 144, 104, 0.28)',
            backgroundColor: 'var(--positive-bg)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '0.85rem', marginTop: '1px', flexShrink: 0 }}>💡</span>
          <p
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--positive)',
              lineHeight: 1.6,
            }}
          >
            Retiring in{' '}
            <strong style={{ color: '#6AC490' }}>{lowest.city.name}</strong> vs{' '}
            <strong style={{ color: '#6AC490' }}>{highest.city.name}</strong> reduces your required fund by{' '}
            <strong style={{ color: '#6AC490' }}>{fmtFull(potentialSavings)}</strong>
          </p>
        </div>
      )}

      {/* Bar chart */}
      <div
        style={{
          padding: '22px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Fund Required vs Projected
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--accent)', opacity: 0.8 }} />
              Needed
            </span>
            <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--positive)', opacity: 0.8 }} />
              Projected
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            barSize={20}
            barGap={3}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="none"
              stroke="var(--border-subtle)"
              vertical={false}
            />
            <XAxis
              dataKey="city"
              tick={{ fill: '#6A6880', fontSize: 10.5, fontFamily: 'DM Mono, monospace' }}
              axisLine={{ stroke: 'var(--border-subtle)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtShort}
              tick={{ fill: '#6A6880', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
              axisLine={false}
              tickLine={false}
              width={62}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="required" name="Needed" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
              ))}
            </Bar>
            <Bar dataKey="projected" name="Projected" radius={[4, 4, 0, 0]} fill="var(--positive)" fillOpacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown table */}
      <div
        style={{
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Cost Breakdown
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '540px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <Th>City</Th>
                {tableRows.map(row => (
                  <Th key={row.key}>{row.label}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((result, i) => (
                <tr
                  key={result.city.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <td
                    style={{
                      padding: '11px 16px',
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {result.city.name}
                  </td>
                  {tableRows.map(row => {
                    const val = row.getValue(result);
                    const color = row.highlight
                      ? 'var(--accent-light)'
                      : row.positive
                      ? 'var(--positive)'
                      : row.danger && val > 0
                      ? '#D47050'
                      : row.danger
                      ? 'var(--positive)'
                      : 'var(--text-secondary)';
                    return (
                      <td
                        key={row.key}
                        style={{
                          padding: '11px 16px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.78rem',
                          color,
                          fontWeight: row.highlight || row.positive || row.danger ? 500 : 400,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.danger && val === 0 ? 'Fully Funded' : fmtFull(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: '0.55rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '2px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '0.82rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: '9px 16px',
        textAlign: 'left',
        fontSize: '0.58rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 400,
        borderBottom: '1px solid var(--border-subtle)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}
