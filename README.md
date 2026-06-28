# Smart Fuel Admin Web

A React + Vite admin dashboard for Smart Fuel fleet operations and fuel tracking. This project connects to a GraphQL backend and provides a secure admin interface for monitoring vehicles, users, live trips, and fuel consumption.

## Key Features

- **Admin login** via GraphQL mutation and token storage in `localStorage`
- **Real-time dashboard** with fleet totals, trip activity, and anomaly warnings
- **User management** page displaying users and their assigned vehicles
- **Vehicle management** page with edit/delete support and live vehicle cards
- **Live trip monitoring** with simulated route progress, speed, fuel logs, and GPS-style tracking
- **Fuel consumption analytics** visualized using `Recharts`
- **Theme toggle** between dark `dark-blue` and light `white-yellow` UI modes
- **Apollo Client** integration for GraphQL queries and mutations

## Technologies

- React 19
- Vite
- Apollo Client
- GraphQL
- Recharts
- Tailwind CSS
- ESLint

## Project structure

- `src/App.jsx` — main layout, auth check, theme toggle, and footer navigation
- `src/main.jsx` — Apollo client setup and root render
- `src/pages/` — feature pages for Dashboard, Login, MapLive, Users, Vehicles, FuelConsumption
- `src/graphql/queries.js` — GraphQL queries used by the app
- `src/graphql/mutations.js` — GraphQL mutations for login, vehicle update/delete, and anomaly resolution
- `src/components/` — reusable UI components such as cards and chart containers
- `src/routes/ProtectedRoute.jsx` — currently present but unused in the current routing flow

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file at project root if needed and set the GraphQL endpoint:

```env
VITE_GRAPHQL_URI=https://localhost:6500/graphql
```

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

5. Preview the production build:

```bash
npm run preview
```

6. Run ESLint checks:

```bash
npm run lint
```

## Usage

- Open the app in your browser using the Vite dev server URL.
- Log in with your admin credential. The app stores `admin_token` and `admin_name` in `localStorage`.
- Use the bottom navigation buttons to switch between:
  - `Tổng Quan` (Dashboard)
  - `Tài Khoản Người Dùng` (Users)
  - `Phương Tiện` (Vehicles)
  - `Phương Tiện Trên Bản Đồ` (Live Map)
  - `Lít Xăng Mỗi Xe` (Fuel Consumption)
- Click the theme switcher in the top bar to toggle dark/light UI styles.

## GraphQL endpoints used

- `GET_ADMIN_DASHBOARD_DATA` — dashboard totals and recent trips
- `GET_ALL_USERS` — user accounts and vehicles
- `GET_ALL_VEHICLES` — vehicle catalog and specs
- `GET_LIVE_TRIPS` — active trips for live tracking
- `GET_VEHICLE_FUEL_REPORT` — fuel and distance report per vehicle
- `LOGIN_MUTATION` — admin authentication
- `UPDATE_VEHICLE`, `DELETE_VEHICLE`, `RESOLVE_TRIP_ANOMALY` — backend mutations

## Notes

- The app defaults to `https://localhost:6500/graphql` when `VITE_GRAPHQL_URI` is not provided.
- The login page will show if `admin_token` is missing from `localStorage`.
- The map page uses polling and simulated live logs to present ongoing vehicle activity.

## Customization

- Replace logo image URLs in `src/App.jsx` with your own branding.
- Adjust the GraphQL endpoint in `.env` as needed.
- Extend page queries and mutations to match your backend schema.

## License

This repository is currently configured as a private project.
