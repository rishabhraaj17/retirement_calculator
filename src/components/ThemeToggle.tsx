'use client';

import { useState } from 'react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [hovered, setHovered] = useState(false);
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isLight ? 'Switch to night mode' : 'Switch to day mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '5px 12px',
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-xs)',
        backgroundColor: hovered ? 'var(--accent-glow)' : 'transparent',
        color: hovered ? 'var(--accent)' : 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: '0.62rem',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.12em',
        transition: 'all 0.14s ease',
        outline: 'none',
      }}
    >
      <span style={{ fontSize: '0.82rem', lineHeight: 1 }}>
        {isLight ? '☽' : '☀'}
      </span>
      {isLight ? 'NIGHT' : 'DAY'}
    </button>
  );
}
