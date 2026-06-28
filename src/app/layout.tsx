import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google';
import ThemeProvider from '@/components/ThemeProvider';
import ThemeToggle from '@/components/ThemeToggle';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RetireAnywhere — DE × IN Fund Modeller',
  description: 'Model retirement fund requirements across German and Indian cities with precision.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body>
        <ThemeProvider>
        <header
          style={{
            height: '65px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--header-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.45rem',
                fontWeight: 500,
                letterSpacing: '0.01em',
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              Retire<span style={{ color: 'var(--accent)' }}>Anywhere</span>
            </h1>
            <span
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              DE × IN Fund Modeller
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: 'var(--positive)',
                  display: 'inline-block',
                  animation: 'pulse-dot 2.4s ease-in-out infinite',
                }}
              />
              LIVE MODEL
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
