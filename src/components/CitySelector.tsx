'use client';

import { useState, useEffect } from 'react';
import { City, CityName, Country } from '@/types';

interface CitySelectorProps {
  selectedCities: CityName[];
  onSelectionChange: (cities: CityName[]) => void;
}

const staticCities: City[] = [
  { id: 'munich', name: 'Munich', country: 'Germany', costOfLivingIndex: 100, rentIndex: 88, groceriesIndex: 105, healthcareCostMonthly: 350, taxRate: 0.15 },
  { id: 'berlin', name: 'Berlin', country: 'Germany', costOfLivingIndex: 82, rentIndex: 68, groceriesIndex: 98, healthcareCostMonthly: 350, taxRate: 0.15 },
  { id: 'delhi-ncr', name: 'Delhi NCR', country: 'India', costOfLivingIndex: 25, rentIndex: 20, groceriesIndex: 22, healthcareCostMonthly: 150, taxRate: 0.10 },
  { id: 'mumbai', name: 'Mumbai', country: 'India', costOfLivingIndex: 30, rentIndex: 35, groceriesIndex: 28, healthcareCostMonthly: 200, taxRate: 0.10 },
  { id: 'bangalore', name: 'Bangalore', country: 'India', costOfLivingIndex: 28, rentIndex: 25, groceriesIndex: 26, healthcareCostMonthly: 180, taxRate: 0.10 },
];

const countryConfig = {
  Germany: { flag: '🇩🇪', color: 'var(--de-color)', bg: 'var(--de-bg)', shadowColor: 'rgba(80, 144, 212, 0.18)' },
  India: { flag: '🇮🇳', color: 'var(--in-color)', bg: 'var(--in-bg)', shadowColor: 'rgba(212, 112, 80, 0.18)' },
};

export default function CitySelector({ selectedCities, onSelectionChange }: CitySelectorProps) {
  const [cities, setCities] = useState<City[]>(staticCities);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/data/cities.json')
      .then(r => r.json())
      .then(data => setCities(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (cityName: CityName) => {
    onSelectionChange(
      selectedCities.includes(cityName)
        ? selectedCities.filter(n => n !== cityName)
        : [...selectedCities, cityName]
    );
  };

  const groupedCities = cities.reduce<Record<Country, City[]>>(
    (acc, city) => { acc[city.country].push(city); return acc; },
    { Germany: [], India: [] }
  );

  if (loading) {
    return (
      <div data-testid="city-selector-loading">
        <SectionLabel>Select Cities</SectionLabel>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div data-testid="city-selector">
      <SectionLabel>Select Cities</SectionLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {(['Germany', 'India'] as Country[]).map(country => {
          const cfg = countryConfig[country];
          return (
            <div key={country}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>{cfg.flag}</span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 500,
                    color: cfg.color,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  {country}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: `linear-gradient(90deg, ${cfg.color}40 0%, transparent 100%)`,
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {groupedCities[country].map(city => {
                  const isSelected = selectedCities.includes(city.name);
                  return (
                    <button
                      key={city.id}
                      onClick={() => handleToggle(city.name)}
                      data-testid={`checkbox-${city.id}`}
                      style={{
                        padding: '8px 13px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isSelected ? cfg.color : 'var(--border-default)'}`,
                        backgroundColor: isSelected ? cfg.bg : 'transparent',
                        color: isSelected ? cfg.color : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-body)',
                        fontWeight: isSelected ? 500 : 400,
                        transition: 'all 0.14s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '1px',
                        boxShadow: isSelected ? `0 0 14px ${cfg.shadowColor}` : 'none',
                        outline: 'none',
                      }}
                    >
                      <span>{city.name}</span>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontFamily: 'var(--font-mono)',
                          color: isSelected ? cfg.color : 'var(--text-muted)',
                          opacity: 0.75,
                        }}
                      >
                        CoL {city.costOfLivingIndex}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
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
        marginBottom: '14px',
      }}
    >
      {children}
    </div>
  );
}
