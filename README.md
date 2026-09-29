# Firefly Personal Financial Dashboard

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Explore%20Showcase-00c853?style=flat-square&logo=githubpages&logoColor=white)](https://giorobert88.github.io/financial-dashboard/)
[![Docker Image](https://img.shields.io/badge/Docker-ghcr.io-blue?style=flat-square&logo=docker&logoColor=white)](https://github.com/giorobert88/financial-dashboard/pkgs/container/financial-dashboard)
[![Release](https://img.shields.io/github/v/release/giorobert88/financial-dashboard?style=flat-square&color=blueviolet)](https://github.com/giorobert88/financial-dashboard/releases)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Donate-orange?style=flat-square&logo=buy-me-a-coffee)](https://buymeacoffee.com/giorobert)

An interactive, responsive financial dashboard optimized for mobile layouts, connecting directly to a **Firefly III** instance. Designed to track Safe-to-Spend pacing, upcoming cycle outgoings, and categorizing transactions on the fly.

## Key Features

1. **Safe-to-Spend Analysis**: Computes disposable income based on total asset balance, subtracting upcoming unpaid bills and credit card statements up to your next payday.
2. **Dynamic Burn Comparison**: Renders an interactive line chart comparing cumulative daily spend against the previous cycle's pacing.
3. **Interactive Uncategorized Queue (`/uncategorized`)**: 
   - Displays transactions from the last 7 days without a category.
   - Accessible via the **Inbox icon** in the main header (which displays a badge count of pending items).
   - Category updates are sent directly to Firefly III, and the transaction is cleared from the queue with a smooth fade animation.
4. **Grouped Accounts Ledger**: Displays active asset and liability accounts structured into *Current Accounts*, *Savings*, and *Credit Cards* with individual activity states.
5. **Credit Card Payment Rules**: Configure statement cycles (statement/due day) and payment preferences (Full statement balance vs Minimum payment calculations) inside the app. Rules are persisted directly within Firefly III as JSON metadata inside each account's notes field.

---

## Technical Stack

- **Framework**: Next.js 16.2 (App Router)
- **Styling**: Tailwind CSS & Vanilla CSS (using a custom `glass-card` system)
- **Charts**: Chart.js (`react-chartjs-2`)
- **Icons**: Lucide React
- **API**: Custom integration layer in `src/lib/firefly.ts` connecting to Firefly III Core v1 API.

---

## Screenshots

Here is a preview of the mobile-first dashboard running in **Demo Mode**:

| Home Dashboard | Accounts Overview | Account Settings |
| :---: | :---: | :---: |
| ![Home Dashboard](docs/images/dashboard_home.jpg) | ![Accounts Overview](docs/images/accounts_overview.jpg) | ![Account Settings](docs/images/account_settings.jpg) |

| Recent Activity | Upcoming Payments |
| :---: | :---: |
| ![Recent Activity](docs/images/recent_activity.jpg) | ![Upcoming Payments](docs/images/upcoming_payments.jpg) |

---

## Built-in Category Styling

The dashboard automatically styles categories and maps them to icons and colors using their names in Firefly III (case-insensitive). To get pretty icons out-of-the-box, name your Firefly III categories to match or contain any of the following:

| Category Types / Keywords | Style / Icon | Color Theme |
| :--- | :---: | :---: |
| `Groceries`, `Grocery`, `Supermarket` | ShoppingCart 🛒 | Amber |
| `Eating out`, `Dining out`, `Restaurants`, `Takeaway`, `Coffee` | Utensils 🍽️ | Orange |
| `Rent`, `Mortgage`, `Housing`, `Home maintenance` | Home 🏠 | Indigo / Amber |
| `Subscriptions`, `Subscription` | CalendarDays 📅 | Cyan |
| `Salary`, `Income`, `Other income`, `Benefit payment` | Banknote / Coins 💵 | Emerald |
| `Gas & electricity`, `Utilities`, `Electricity`, `Power`, `Water` | Zap ⚡ | Cyan |
| `Transport`, `Car`, `Fuel`, `Gas`, `Parking` | Car / Fuel 🚗 | Blue |
| `Gym`, `Fitness` | Dumbbell 🏋️ | Rose |
| `Healthcare`, `Medical`, `Dentist`, `Health` | HeartPulse 🏥 | Rose |
| `Entertainment`, `Hobbies`, `Leisure` | Film / Palette 🎭 | Violet |
| `Holidays`, `Travel`, `Days out` | Plane / Compass ✈️ | Sky / Orange |
| `Clothing`, `Clothes`, `Clothing & shoes` | Shirt 👕 | Amber |
| `Car insurance`, `Home insurance`, `Insurance` | Shield 🛡️ | Blue |
| `Credit card`, `Credit card payments`, `Loans` | CreditCard 💳 | Cyan / Rose |
| `Savings`, `Saving` | PiggyBank 🏦 | Emerald |
| `Baby`, `Maternity`, `Child & dependent expenses` | Baby / Smile 👶 | Pink |
| `Pets` | PawPrint 🐾 | Orange |
| `Charity` | Heart ❤️ | Rose |
| `Taxes`, `Tax`, `Council tax`, `Road tax` | FileText 📄 | Zinc |
| `Cash`, `Cash withdrawals` | Banknote 💵 | Zinc |

---

## Firefly III Prerequisites

Before launching the dashboard, make sure your Firefly III instance has the following:

1. **Asset Account**: At least one active asset account (e.g., your primary checking/current account).
2. **Personal Access Token (PAT)**: Generate a new token in Firefly III under **Options > Profile > OAuth > Personal Access Tokens**.
3. **Credit Card Classification**: For the dashboard to identify an account as a credit card, make sure its **Role** is set to **Credit Card** in Firefly III (or its name contains `"credit card"`).

*Note: All other settings (such as marking your primary current account or setting credit card statement/due dates) can be configured directly in the Dashboard UI. The dashboard stores these preferences as JSON metadata inside the notes field of your accounts in Firefly III.*

---

## Getting Started (Docker)

The application is distributed as a pre-built multi-architecture Docker image (`linux/amd64` and `linux/arm64`) via GitHub Container Registry (GHCR), meaning you don't even need the source code to run it.

### 1. Prepare Configuration

Create a dedicated directory on your server and prepare the following files:

**docker-compose.yml**:
```yaml
services:
  dashboard:
    image: ghcr.io/giorobert88/financial-dashboard:latest
    container_name: firefly-dashboard
    restart: unless-stopped
    ports:
      - "3001:3000"
    env_file:
      - .env.local
    environment:
      - AUTH_FILE_PATH=/app/data/.dashboard_auth
    volumes:
      - dashboard_data:/app/data

volumes:
  dashboard_data:
```

**.env.local**:
```env
SESSION_SECRET="generate-with-openssl-rand-base64-32"
# Execute in Linux terminal: openssl rand -base64 32

# Optional (Can be configured in the UI instead)
# FIREFLY_API_URL="http://your-firefly-server:8080"
# FIREFLY_PAT="your-firefly-personal-access-token"
```

> [!TIP]
> - Generate a secure session secret with: `openssl rand -base64 32`
> - **API Connection**: You can configure your Firefly III API URL and Personal Access Token (PAT) directly in the dashboard UI under **Settings > API Connection**. Alternatively, you can pre-configure them by uncommenting the environment variables in `.env.local`.

### 2. Start the Container

Run the following command in the same directory:
```bash
docker compose up -d
```

To stop the dashboard: `docker compose down`. To inspect output: `docker compose logs -f`.

*Note: The `./data` directory will be created automatically to securely persist your dashboard password across container updates.*

### 3. First-Time Setup

Navigate to `http://localhost:3001` (or your server's IP). On first launch, you will be prompted to create a dashboard password to protect access to your financial data.



## Project Structure

```
src/
├── app/
│   ├── actions/         # Server actions (auth, transactions, automations)
│   ├── api/             # API routes
│   ├── dashboard/       # Dashboard pages with cycle navigation
│   ├── login/           # Login page
│   ├── settings/        # Settings (accounts, connection, rules)
│   ├── uncategorized/   # Transaction categorization queue
│   └── ...
├── components/          # Reusable UI components
├── hooks/               # Custom React hooks
├── lib/
│   ├── api/             # Firefly III API client & data fetching
│   └── ...              # Utilities, formatting, payday logic
├── proxy.ts             # Request routing and proxy logic
└── sw.ts                # Service worker source (Serwist)
```

---

## Support & AI Collaboration

This is my first coding project built in collaboration with an AI partner. Leveraging AI has allowed me to design, build, secure, and package this dashboard as a production-ready Docker container, showing just how powerful human-AI pair programming can be.

If you enjoy using this dashboard and would like to support its ongoing development, please consider donating:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%2520Me%2520a%2520Coffee-Donate-orange?style=flat-square&logo=buy-me-a-coffee)](https://buymeacoffee.com/giorobert)

---

## License

GNU General Public License v3 (GPLv3) - see the [LICENSE](file:///Users/robertheyworth/Home%20Server/Pi5/financial-dashboard/LICENSE) file for details.
