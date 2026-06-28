'use client';

import { useState } from 'react';
import { Assumptions } from '@/types';

interface AssumptionsPanelProps {
  assumptions: Assumptions;
  onRefresh: () => void;
}

const INFLATION_RATES = {
  Germany: 0.05,
  India: 0.04,
};

export default function AssumptionsPanel({ assumptions, onRefresh }: AssumptionsPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    onRefresh();
    setIsRefreshing(false);
  };

  return (
    <div data-testid="assumptions-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div
        style={{
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Inflation Benchmarks
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <InflationCard
          flag="🇩🇪"
          label="Germany"
          rate={INFLATION_RATES.Germany}
          color="var(--de-color)"
          bg="var(--de-bg)"
          source="Eurostat"
          testId="inflation-source-germany"
        />
        <InflationCard
          flag="🇮🇳"
          label="India"
          rate={INFLATION_RATES.India}
          color="var(--in-color)"
          bg="var(--in-bg)"
          source="RBI"
          testId="inflation-source-india"
        />
      </div>

      <div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          data-testid="refresh-data-button"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: `1px solid ${hovered && !isRefreshing ? 'var(--accent)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-xs)',
            color: hovered && !isRefreshing ? 'var(--accent)' : isRefreshing ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
            transition: 'all 0.14s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            outline: 'none',
          }}
        >
          {isRefreshing ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: '9px',
                  height: '9px',
                  border: '1.5px solid var(--text-muted)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              Refreshing…
            </>
          ) : (
            '↻  Refresh Data'
          )}
        </button>

        <p
          style={{
            fontSize: '0.58rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginTop: '7px',
            lineHeight: 1.6,
          }}
        >
          Sourced from Eurostat (DE) · RBI (IN)
        </p>
      </div>
    </div>
  );
}

function InflationCard({
  flag,
  label,
  rate,
  color,
  bg,
  source,
  testId,
}: {
  flag: string;
  label: string;
  rate: number;
  color: string;
  bg: string;
  source: string;
  testId: string;
}) {
  return (
    <div
      style={{
        padding: '12px 13px',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--border-subtle)',
        backgroundColor: bg,
      }}
    >
      <div
        style={{
          fontSize: '0.58rem',
          fontFamily: 'var(--font-mono)',
          color,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '6px',
          opacity: 0.7,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>{flag}</span>
        <span>{label}</span>
      </div>
      <div
        style={{
          fontSize: '1.35rem',
          fontFamily: 'var(--font-mono)',
          color,
          fontWeight: 500,
          lineHeight: 1,
          marginBottom: '4px',
        }}
      >
        {(rate * 100).toFixed(1)}%
      </div>
      <div
        style={{
          fontSize: '0.58rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
        data-testid={testId}
      >
        {source} default
      </div>
    </div>
  );
}
