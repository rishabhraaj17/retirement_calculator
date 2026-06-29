'use client';

import { useState, useEffect } from 'react';
import { City, CityName, UserInputs, Assumptions, CalculationResult } from '@/types';
import CitySelector from '@/components/CitySelector';
import InputForm from '@/components/InputForm';
import AssumptionsPanel from '@/components/AssumptionsPanel';
import ComparisonDashboard from '@/components/ComparisonDashboard';
import SingleCityDashboard from '@/components/SingleCityDashboard';
import { calculateRetirementFund } from '@/lib/calculator';

const defaultUserInputs: UserInputs = {
  currentAge: 30,
  retirementAge: 65,
  currentSavings: 50000,
  monthlyContribution: 1000,
  baseMonthlyExpense: 3000,
  baseRent: 1050,
  baseGroceries: 540,
  baseHealthcare: 350,
  baseOthers: 1060,
};

const defaultAssumptions: Assumptions = {
  investmentReturn: 0.06,
  inflationRate: 0.04,
  retirementYears: 20,
  countryInflation: {
    Germany: 0.05,
    India: 0.04,
  },
  countryInvestmentReturn: {
    Germany: 0.06,
    India: 0.08,
  },
};

const staticCities: City[] = [
  { id: 'munich', name: 'Munich', country: 'Germany', costOfLivingIndex: 100, rentIndex: 88, groceriesIndex: 105, healthcareCostMonthly: 350, taxRate: 0.15 },
  { id: 'berlin', name: 'Berlin', country: 'Germany', costOfLivingIndex: 82, rentIndex: 68, groceriesIndex: 98, healthcareCostMonthly: 350, taxRate: 0.15 },
  { id: 'delhi-ncr', name: 'Delhi NCR', country: 'India', costOfLivingIndex: 25, rentIndex: 20, groceriesIndex: 22, healthcareCostMonthly: 150, taxRate: 0.10 },
  { id: 'mumbai', name: 'Mumbai', country: 'India', costOfLivingIndex: 30, rentIndex: 35, groceriesIndex: 28, healthcareCostMonthly: 200, taxRate: 0.10 },
  { id: 'bangalore', name: 'Bangalore', country: 'India', costOfLivingIndex: 28, rentIndex: 25, groceriesIndex: 26, healthcareCostMonthly: 180, taxRate: 0.10 },
];

export default function Home() {
  const [cities, setCities] = useState<City[]>(staticCities);
  const [selectedCities, setSelectedCities] = useState<CityName[]>([]);
  const [userInputs, setUserInputs] = useState<UserInputs>(defaultUserInputs);
  const [assumptions, setAssumptions] = useState<Assumptions>(defaultAssumptions);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Tab view state: 'single' | 'compare'
  const [viewTab, setViewTab] = useState<'single' | 'compare'>('single');
  // Selected city for deep dive SingleCityDashboard
  const [selectedCityForSingle, setSelectedCityForSingle] = useState<CityName | null>(null);

  useEffect(() => {
    fetch('/data/cities.json')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(setCities)
      .catch(() => {
        setError('Error loading cities');
      });
  }, []);

  // Manage viewTab default and selectedCityForSingle when selectedCities changes
  useEffect(() => {
    if (selectedCities.length === 1) {
      setViewTab('single');
      setSelectedCityForSingle(selectedCities[0]);
    } else if (selectedCities.length > 1) {
      if (!selectedCityForSingle || !selectedCities.includes(selectedCityForSingle)) {
        setSelectedCityForSingle(selectedCities[0]);
      }
    } else {
      setSelectedCityForSingle(null);
    }
  }, [selectedCities, selectedCityForSingle]);

  useEffect(() => {
    if (selectedCities.length > 0 && cities.length > 0) {
      const calculated = selectedCities
        .map(name => cities.find(c => c.name === name))
        .filter((c): c is City => c !== undefined)
        .map(city => calculateRetirementFund(city, userInputs, assumptions));
      setResults(calculated);
    } else {
      setResults([]);
    }
  }, [selectedCities, cities, userInputs, assumptions]);

  const handleCityChange = (updatedCity: City) => {
    setCities(prev => prev.map(c => c.id === updatedCity.id ? updatedCity : c));
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside
        style={{
          borderRight: '1px solid var(--border-subtle)',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '24px 22px', flex: 1 }}>
          <CitySelector
            cities={cities}
            selectedCities={selectedCities}
            onSelectionChange={setSelectedCities}
            onAddCity={(newCity) => setCities(prev => [...prev, newCity])}
            error={error}
          />

          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--border-subtle)',
              margin: '22px 0',
            }}
          />

          <InputForm
            userInputs={userInputs}
            assumptions={assumptions}
            onUserInputsChange={setUserInputs}
            onAssumptionsChange={setAssumptions}
          />

          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--border-subtle)',
              margin: '22px 0',
            }}
          />

          <AssumptionsPanel
            assumptions={assumptions}
            onRefresh={() => setAssumptions({ ...assumptions })}
            onAssumptionsChange={setAssumptions}
          />
        </div>
      </aside>

      {/* Main content */}
      <section style={{ overflowY: 'auto', padding: '32px 36px' }}>
        {selectedCities.length === 0 ? (
          <ComparisonDashboard
            results={results}
            userInputs={userInputs}
            onUserInputsChange={setUserInputs}
          />
        ) : (
          <>
            {/* View switcher tabs */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '16px',
              marginBottom: '28px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setViewTab('single')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: viewTab === 'single' ? 'var(--bg-elevated)' : 'transparent',
                    border: '1px solid ' + (viewTab === 'single' ? 'var(--border-strong)' : 'transparent'),
                    color: viewTab === 'single' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.14s ease',
                    fontWeight: viewTab === 'single' ? 500 : 400,
                  }}
                >
                  Single City Focus
                </button>
                <button
                  onClick={() => setViewTab('compare')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: viewTab === 'compare' ? 'var(--bg-elevated)' : 'transparent',
                    border: '1px solid ' + (viewTab === 'compare' ? 'var(--border-strong)' : 'transparent'),
                    color: viewTab === 'compare' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.14s ease',
                    fontWeight: viewTab === 'compare' ? 500 : 400,
                  }}
                >
                  Compare Cities
                </button>
              </div>

              <div style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                {selectedCities.length} {selectedCities.length === 1 ? 'City' : 'Cities'} Selected
              </div>
            </div>

            {/* View contents */}
            {viewTab === 'single' ? (
              <>
                {/* City dropdown selector for deep dive when 2+ cities selected */}
                {selectedCities.length > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '24px',
                    animation: 'fadeInUp 0.2s ease',
                  }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}>
                      Deep Dive Focus:
                    </span>
                    <select
                      value={selectedCityForSingle || ''}
                      onChange={(e) => setSelectedCityForSingle(e.target.value as CityName)}
                      data-testid="city-deep-dive-select"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.82rem',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        outline: 'none',
                        minWidth: '160px',
                      }}
                    >
                      {selectedCities.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(() => {
                  const activeCityName = selectedCityForSingle && selectedCities.includes(selectedCityForSingle)
                    ? selectedCityForSingle
                    : selectedCities[0] || null;
                  const activeResult = results.find(r => r.city.name === activeCityName);
                  return activeResult ? (
                    <SingleCityDashboard
                      result={activeResult}
                      userInputs={userInputs}
                      onUserInputsChange={setUserInputs}
                      onCityChange={handleCityChange}
                    />
                  ) : null;
                })()}
              </>
            ) : (
              <ComparisonDashboard
                results={results}
                userInputs={userInputs}
                onUserInputsChange={setUserInputs}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
