'use client';

import { useState } from 'react';
import { City, CityName, Country } from '@/types';

interface CitySelectorProps {
  cities: City[];
  selectedCities: CityName[];
  onSelectionChange: (cities: CityName[]) => void;
  onAddCity: (newCity: City) => void;
  error?: string | null;
}

const countryConfig = {
  Germany: { flag: '🇩🇪', color: 'var(--de-color)', bg: 'var(--de-bg)', shadowColor: 'rgba(80, 144, 212, 0.18)' },
  India: { flag: '🇮🇳', color: 'var(--in-color)', bg: 'var(--in-bg)', shadowColor: 'rgba(212, 112, 80, 0.18)' },
};

export default function CitySelector({
  cities,
  selectedCities,
  onSelectionChange,
  onAddCity,
  error,
}: CitySelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [cityNameInput, setCityNameInput] = useState('');
  const [countryInput, setCountryInput] = useState<Country>('Germany');
  const [colInput, setColInput] = useState(50);
  const [rentInput, setRentInput] = useState(50);
  const [groceriesInput, setGroceriesInput] = useState(50);
  const [healthcareInput, setHealthcareInput] = useState(200);
  const [taxInput, setTaxInput] = useState(15);
  const [addError, setAddError] = useState<string | null>(null);

  const handleToggle = (cityName: CityName) => {
    onSelectionChange(
      selectedCities.includes(cityName)
        ? selectedCities.filter(n => n !== cityName)
        : [...selectedCities, cityName]
    );
  };

  const handleAddCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const nameTrimmed = cityNameInput.trim();
    if (!nameTrimmed) {
      setAddError('Please enter a valid city name');
      return;
    }

    const nameExists = cities.some(
      c => c.name.toLowerCase() === nameTrimmed.toLowerCase()
    );
    if (nameExists) {
      setAddError('A city with this name already exists');
      return;
    }

    const newCity: City = {
      id: nameTrimmed.toLowerCase().replace(/\s+/g, '-'),
      name: nameTrimmed as CityName,
      country: countryInput,
      costOfLivingIndex: colInput,
      rentIndex: rentInput,
      groceriesIndex: groceriesInput,
      healthcareCostMonthly: healthcareInput,
      taxRate: taxInput / 100,
    };

    onAddCity(newCity);
    onSelectionChange([...selectedCities, newCity.name]);

    // Reset inputs
    setCityNameInput('');
    setColInput(50);
    setRentInput(50);
    setGroceriesInput(50);
    setHealthcareInput(200);
    setTaxInput(15);
    setShowAddForm(false);
  };

  const groupedCities = cities.reduce<Record<Country, City[]>>(
    (acc, city) => {
      acc[city.country].push(city);
      return acc;
    },
    { Germany: [], India: [] }
  );

  return (
    <div data-testid="city-selector">
      <SectionLabel>Select Cities</SectionLabel>

      {error && (
        <div
          data-testid="city-selector-error"
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--danger)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            marginBottom: '14px',
          }}
        >
          {error}
        </div>
      )}

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
                      role="checkbox"
                      aria-checked={isSelected}
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

      {/* Add Custom City Collapsible */}
      <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
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
          {showAddForm ? '▼ Close Custom City Form' : '▶ Add Custom City'}
        </button>

        {showAddForm && (
          <form
            onSubmit={handleAddCitySubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: '12px',
              padding: '12px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              animation: 'fadeInUp 0.16s ease',
            }}
          >
            <div>
              <label htmlFor="custom-city-name" style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                City Name
              </label>
              <input
                id="custom-city-name"
                type="text"
                required
                value={cityNameInput}
                onChange={e => setCityNameInput(e.target.value)}
                placeholder="e.g. Frankfurt"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label htmlFor="custom-city-country" style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                Country
              </label>
              <select
                id="custom-city-country"
                value={countryInput}
                onChange={e => setCountryInput(e.target.value as Country)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="Germany">Germany</option>
                <option value="India">India</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label htmlFor="custom-city-col" style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                  CoL Index
                </label>
                <input
                  id="custom-city-col"
                  type="number"
                  min={1}
                  max={200}
                  value={colInput}
                  onChange={e => setColInput(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label htmlFor="custom-city-rent" style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                  Rent Index
                </label>
                <input
                  id="custom-city-rent"
                  type="number"
                  min={1}
                  max={200}
                  value={rentInput}
                  onChange={e => setRentInput(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label htmlFor="custom-city-groceries" style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                  Groceries Index
                </label>
                <input
                  id="custom-city-groceries"
                  type="number"
                  min={1}
                  max={200}
                  value={groceriesInput}
                  onChange={e => setGroceriesInput(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label htmlFor="custom-city-tax" style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                  Tax Rate %
                </label>
                <input
                  id="custom-city-tax"
                  type="number"
                  min={0}
                  max={90}
                  value={taxInput}
                  onChange={e => setTaxInput(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="custom-city-healthcare" style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                Monthly Healthcare (€)
              </label>
              <input
                id="custom-city-healthcare"
                type="number"
                min={0}
                max={2000}
                value={healthcareInput}
                onChange={e => setHealthcareInput(parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  outline: 'none',
                }}
              />
            </div>

            {addError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>
                {addError}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'var(--accent)',
                color: 'var(--bg-base)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: '4px',
                transition: 'all 0.12s ease',
              }}
            >
              Add Custom City
            </button>
          </form>
        )}
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
