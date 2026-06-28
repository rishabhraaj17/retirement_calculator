# RetireAnywhere

A retirement fund comparison calculator for Germany and India, built with Next.js and TypeScript.

Compare how much you need to retire comfortably across Munich, Berlin, Delhi NCR, Mumbai, and Bangalore — with accurate compound interest projections, inflation-adjusted drawdown modeling, and a clean Private Wealth Office aesthetic.

## Features

- **City comparison** — side-by-side analysis across 5 cities in Germany and India
- **Accurate financial math** — compound interest (FV), ordinary annuity projections, and present value of inflation-adjusted retirement drawdowns
- **Funding gap analysis** — see exactly how much you're on track vs. short
- **Day / Night theme** — warm parchment light mode and dark wealth office dark mode
- **Docker support** — run locally or in a container

## Getting Started

### Local

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker

```bash
docker-compose up
```

## Tech Stack

- [Next.js](https://nextjs.org/) 15 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- Jest

## Financial Model

| Input | Description |
|---|---|
| Current Age / Retirement Age | Determines accumulation window |
| Current Savings | Compounded at investment return rate over years to retirement |
| Monthly Contribution | Future value via ordinary annuity formula |
| Investment Return | Annual rate (default 6%) |
| Inflation Rate | Applied during retirement drawdown phase |
| Years in Retirement | Determines required lump sum via PV of inflation-adjusted expenses |

The **Required Fund** is the lump sum needed on retirement day 1 to fund all future monthly expenses, accounting for both inflation during retirement and the continued investment return on the remaining balance.

## Project Structure

```
src/
├── app/
│   ├── api/col/[city]/   # City cost-of-living API
│   ├── globals.css        # Theme variables (dark + light)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── CitySelector.tsx
│   ├── InputForm.tsx
│   ├── ComparisonDashboard.tsx
│   ├── AssumptionsPanel.tsx
│   ├── ThemeProvider.tsx
│   └── ThemeToggle.tsx
├── lib/
│   └── calculator.ts      # Core financial math
└── types/
    └── index.ts
```

## Authors

- **Rishabh Raj** — [rishabh.raaj17@gmail.com](mailto:rishabh.raaj17@gmail.com)

## License

MIT
