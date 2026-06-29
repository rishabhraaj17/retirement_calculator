'use client';

import { useState, useEffect } from 'react';
import { Assumptions } from '@/types';

interface AssumptionsPanelProps {
  assumptions: Assumptions;
  onRefresh: () => void;
  onAssumptionsChange: (assumptions: Assumptions) => void;
}

export function HelpIcon({ text }: { text: string }) {
  return (
    <span
      className="tooltip-trigger"
      style={{
        cursor: 'help',
        marginLeft: '4px',
        opacity: 0.6,
        fontSize: '0.72rem',
        position: 'relative',
        display: 'inline-block'
      }}
    >
      ⓘ
      <span className="tooltip-content">{text}</span>
    </span>
  );
}

export default function AssumptionsPanel({
  assumptions,
  onRefresh,
  onAssumptionsChange,
}: AssumptionsPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hovered, setHovered] = useState(false);

  const countryInflation = assumptions.countryInflation || {
    Germany: 0.05,
    India: 0.04,
  };

  const countryInvestmentReturn = assumptions.countryInvestmentReturn || {
    Germany: 0.06,
    India: 0.08,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    onRefresh();
    setIsRefreshing(false);
  };

  const handleAssumptionsChange = (
    country: 'Germany' | 'India',
    field: 'inflation' | 'return',
    newVal: number
  ) => {
    if (field === 'inflation') {
      onAssumptionsChange({
        ...assumptions,
        countryInflation: {
          ...countryInflation,
          [country]: newVal,
        },
      });
    } else {
      onAssumptionsChange({
        ...assumptions,
        countryInvestmentReturn: {
          ...countryInvestmentReturn,
          [country]: newVal,
        },
      });
    }
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
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span>Country Benchmarks</span>
        <HelpIcon text="Country-specific economic assumptions. India typically features higher average inflation alongside higher investment yields compared to Germany." />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <CountryBenchmarkCard
          flag="🇩🇪"
          label="Germany"
          inflationRate={countryInflation.Germany}
          onInflationChange={(val) => handleAssumptionsChange('Germany', 'inflation', val)}
          returnRate={countryInvestmentReturn.Germany}
          onReturnChange={(val) => handleAssumptionsChange('Germany', 'return', val)}
          color="var(--de-color)"
          bg="var(--de-bg)"
          source="Eurostat"
          inflationTestId="input-inflation-germany"
          returnTestId="input-return-germany"
        />
        <CountryBenchmarkCard
          flag="🇮🇳"
          label="India"
          inflationRate={countryInflation.India}
          onInflationChange={(val) => handleAssumptionsChange('India', 'inflation', val)}
          returnRate={countryInvestmentReturn.India}
          onReturnChange={(val) => handleAssumptionsChange('India', 'return', val)}
          color="var(--in-color)"
          bg="var(--in-bg)"
          source="RBI"
          inflationTestId="input-inflation-india"
          returnTestId="input-return-india"
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

function CountryBenchmarkCard({
  flag,
  label,
  inflationRate,
  onInflationChange,
  returnRate,
  onReturnChange,
  color,
  bg,
  source,
  inflationTestId,
  returnTestId,
}: {
  flag: string;
  label: string;
  inflationRate: number;
  onInflationChange: (newRate: number) => void;
  returnRate: number;
  onReturnChange: (newRate: number) => void;
  color: string;
  bg: string;
  source: string;
  inflationTestId: string;
  returnTestId: string;
}) {
  const formatRateStr = (r: number) => Number((r * 100).toFixed(1)).toString();
  const [localInf, setLocalInf] = useState(formatRateStr(inflationRate));
  const [localRet, setLocalRet] = useState(formatRateStr(returnRate));

  useEffect(() => {
    const propNum = parseFloat(formatRateStr(inflationRate));
    const localNum = parseFloat(localInf);
    if (propNum !== localNum && !isNaN(propNum)) {
      setLocalInf(formatRateStr(inflationRate));
    }
  }, [inflationRate]);

  useEffect(() => {
    const propNum = parseFloat(formatRateStr(returnRate));
    const localNum = parseFloat(localRet);
    if (propNum !== localNum && !isNaN(propNum)) {
      setLocalRet(formatRateStr(returnRate));
    }
  }, [returnRate]);

  const handleInfChange = (valStr: string) => {
    setLocalInf(valStr);
    const parsed = parseFloat(valStr);
    onInflationChange(!isNaN(parsed) ? parsed / 100 : 0);
  };

  const handleRetChange = (valStr: string) => {
    setLocalRet(valStr);
    const parsed = parseFloat(valStr);
    onReturnChange(!isNaN(parsed) ? parsed / 100 : 0);
  };

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--border-subtle)',
        backgroundColor: bg,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div
        style={{
          fontSize: '0.58rem',
          fontFamily: 'var(--font-mono)',
          color,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: 0.7,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>{flag}</span>
        <span>{label}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
            Inflation
          </label>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', color, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <input
              data-testid={inflationTestId}
              type="number"
              value={localInf}
              onChange={e => handleInfChange(e.target.value)}
              step="0.1"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px dashed var(--accent)',
                color: 'inherit',
                fontSize: '1.25rem',
                fontFamily: 'var(--font-mono)',
                width: '55px',
                outline: 'none',
              }}
            />
            <span>%</span>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
            Return
          </label>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', color, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <input
              data-testid={returnTestId}
              type="number"
              value={localRet}
              onChange={e => handleRetChange(e.target.value)}
              step="0.1"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px dashed var(--accent)',
                color: 'inherit',
                fontSize: '1.25rem',
                fontFamily: 'var(--font-mono)',
                width: '55px',
                outline: 'none',
              }}
            />
            <span>%</span>
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: '0.55rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {source} default
      </div>
    </div>
  );
}

