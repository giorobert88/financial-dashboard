# Release Notes

## 🌟 What's New in v0.3.0

> Special thanks to **[@drobati](https://github.com/drobati)** for contributing both the system-adaptive light mode ([#19](https://github.com/giorobert88/financial-dashboard/pull/19)) and the semi-monthly payday schedule ([#18](https://github.com/giorobert88/financial-dashboard/pull/18)) in this release! 🎉

### 🌓 Automatic Light Mode (System Scheme Adaptive)
- **Zero-Friction System Theme**: Light mode now automatically switches based on OS/browser preference (`prefers-color-scheme: light`) without altering dark mode's appearance.
- **Inverted Palette & High Contrast**: Inverts Tailwind v4's zinc tokens and white/black variables, with darkened accent shades to maintain contrast on bright backgrounds.
- **Solid Button Legibility**: Guaranteed pure white text on emerald green, rose, and amber action buttons (`GlassDialog`, transaction drawer, and error recovery pages).
- **Theme-Aware Charts**:
  - Category doughnut chart dynamically switches segment borders between dark and light backgrounds.
  - Neutral zinc-500 axis tick marks and grid lines readable across all color schemes.
  - Previous cycle comparison dashed lines tuned for legibility on light canvases.
- **Browser Chrome Synchronization**: Dynamic `Viewport.themeColor` adjusts iOS Safari and mobile status bars to `#fafafa` in light mode and `#09090b` in dark mode.

### 📅 Semi-Monthly Payday Schedule (15th & 30th)
- **15th & 30th Frequency**: Added a fourth payday frequency (`semi_monthly`) for users paid on fixed dates twice monthly.
- **February End-of-Month Handling**: Automatically resolves the second February payday to the last day of the month (Feb 28 or Feb 29 in leap years).
- **Weekend Rollback Support**: Saturday or Sunday paydays optionally roll back to the preceding Friday.
- **Continuous Cycle Navigation (`shiftCycle`)**: Replaced fixed millisecond stepping with calendar-aware cycle shifting, eliminating DST boundary drift across non-uniform cycles.
- **Dedicated Test Suite**: Added `scripts/payday-semi-monthly.test.mts` with `npm test` / `npm run test:payday`.

### 🛠️ Technical Improvements & Maintenance
- **Clean Configuration Serialization**: Sanitized settings payload builder to avoid saving redundant `null` values for non-applicable rules.
- **Docker Actions Updates**: Bumped GitHub Actions workflows (`docker/build-push-action@v7`, `docker/setup-buildx-action@v4`, `docker/login-action@v4`).
- **Dependency Bumps**: Upgraded `lucide-react` (1.51.0), `eslint-config-next` (16.3.8), and `shadcn` (4.21.1).

---

## 🌟 What's New in v0.2.0

### 📅 Flexible Payday Scheduling (Weekly & Bi-Weekly)
- **Weekly & Bi-Weekly Cycles**: Added full support for configuring weekly and bi-weekly payday cycles in `/settings/payday` alongside existing monthly cycles.
- **Dynamic Period Calculations**: Automatic calculation of current, previous, and next budget cycles tailored to your custom payday frequency.
- **Batch API Optimizations**: Optimized transaction and balance queries to Firefly III into efficient batch requests, drastically cutting dashboard loading latency.

### ⚙️ Rules API & Service Layer Modernization
- **Unified Rules API**: Integrated Firefly III rules management directly under the `@/lib/firefly` API surface, standardizing automation and rule group creation.
- **PWA & Edge Proxy Bypass**: Enhanced edge proxy routing to ensure service worker (`/sw.js`) and application icons (`/icon-*.png`, `/apple-icon.png`) are exempt from session authentication redirects, enabling robust offline caching and home screen installation.
- **React 19 & Next.js 16.3 Compliance**: Aligned `CurrencyContext` state initialization with React 19 conventions, eliminating synchronous effect state triggers and ESLint warnings.
- **Core Dependency Updates**: Upgraded Next.js to `16.3.7`, React to `19.3.0`, Serwist to `9.5.12`, Lucide React to `1.48.0`, and Tailwind CSS to `4.3.3`.

---

## 🌟 What's New in v0.1.1

### 💱 Configurable Display Currency & Firefly III Integration
- **Automatic Firefly III Currency Sync**: The dashboard now automatically queries your Firefly III instance (`GET /api/v1/currencies/default`) to adopt your preferred default currency (USD `$`, EUR `€`, GBP `£`, CAD `$`, AUD `$`, JPY `¥`, CHF, etc.) seamlessly without manual setup.
- **Interactive Currency Settings Page**: Added a new settings sub-page at `/settings/currency` allowing you to select and preview display currencies with live formatting examples before saving.
- **App-Wide Dynamic Formatting**:
  - Net Worth, Liquid total, and account balances on the Accounts page.
  - Income, Expenses, and Category totals on the Dashboard & Period ledgers.
  - Upcoming payments, credit card balances, and subscription projections.
  - Interactive Chart.js y-axes and hover tooltips.
  - Transaction items, category triage drawers, and insights alerts.
- **Offline & Demo Mode Fallbacks**: Robust fallback support for standard global currencies when running in demo mode or offline.

---

## 🛠️ Technical Improvements & Fixes
- **Next.js & React 19 Client/Server Context**: Created `CurrencyContext` and wrapped root layout in `CurrencyProvider` initialized with server-resolved display currency from cookies / Firefly III.
- **Chart.js Dynamic Callbacks**: Converted static chart label callbacks to dynamic formatters using active client currency context.
- **Insights Engine Alignment**: Updated server-side insights engine to pass currency-aware formatting functions for alert threshold messages.
- **Cleaner Imports**: Removed static formatter defaults to prevent GBP fallback across server and client components.

---

## 🚀 How to Upgrade (Docker / Raspberry Pi 5)

If you are running the dashboard via Docker Compose, pull the updated `v0.1.1` (or `latest`) image:

```bash
docker compose pull
docker compose up -d --force-recreate
```
