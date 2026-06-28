'use client';

import { useState, useEffect } from 'react';
import { City, CityName, UserInputs, Assumptions, CalculationResult } from '@/types';
import CitySelector from '@/components/CitySelector';
import InputForm from '@/components/InputForm';
import AssumptionsPanel from '@/components/AssumptionsPanel';
import ComparisonDashboard from '@/components/ComparisonDashboard';
import { calculateRetirementFund } from '@/lib/calculator';

const defaultUserInputs: UserInputs = {
  currentAge: 30,
  retirementAge: 65,
  currentSavings: 50000,
  monthlyContribution: 1000,
};

const defaultAssumptions: Assumptions = {
  investmentReturn: 0.06,
  inflationRate: 0.04,
  retirementYears: 20,
  countryInflation: {
    Germany: 0.05,
    India: 0.04,
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

  useEffect(() => {
    fetch('/data/cities.json')
      .then(r => r.json())
      .then(setCities)
      .catch(() => {});
  }, []);

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
            selectedCities={selectedCities}
            onSelectionChange={setSelectedCities}
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
        <ComparisonDashboard results={results} />
      </section>
    </div>
  );
}
