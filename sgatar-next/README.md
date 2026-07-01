# SGATAR 2026 Transport Planner

Live operational transport management platform for the SGATAR 2026 conference. Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Drizzle ORM, and Neon Serverless Postgres.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables and configure
cp .env.example .env.local

# Push database schema to Neon
npm run db:push

# Seed initial routes and trips
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the Delegate view.

---

## Portal Access

| Portal               | URL        | Access                     |
| -------------------- | ---------- | -------------------------- |
| Delegate (Public)    | `/`        | No authentication required |
| Liaison Officer      | `/lo`      | Event passcode required    |
| Admin / Control Room | `/admin`   | Admin passcode required    |
| Signage / FIDS       | `/display` | No authentication required |

---

## Guide: Delegates

The delegate portal at `/` provides a read-only, real-time view of conference transport.

### What you see

- **Capacity Widget** — Aggregate seat availability across all active buses (e.g. "120 of 320 seats filled").
- **Departure Timeline** — High-contrast list of the next 10 departures showing time, route, pickup/dropoff, and live status (Scheduled / Boarding / Delayed).
- **WhatsApp Banner** — Tap to join the live WhatsApp updates group for push notifications.

### Language support

Use the language switcher (top right) to change the UI to any of the 13 supported languages: English, 简体中文, 繁體中文, 日本語, 한국어, Bahasa Indonesia, ภาษาไทย, Tiếng Việt, ភាសាខ្មែរ, ພາສາລາວ, Bahasa Melayu, မြန်မာဘာသာ, and Tetum.

### Tips

- The page auto-refreshes every 4 seconds — no need to manually reload.
- If connectivity drops, the last known state remains visible.
- The FIDS display at `/display` can be cast to hotel lobby monitors for a large-font, airport-style departure board.

---

## Guide: Liaison Officers (LOs)

The LO portal at `/lo` is a mobile-optimized interface for on-ground bus crew.

### Getting access

1. Navigate to `/lo` (you'll be redirected to `/login`).
2. Select **Liaison Officer** from the portal dropdown.
3. Enter the event passcode provided by the operations team.

### Headcount management

Each assigned bus shows a headcount card with:

- **Large +/- buttons** (min 44×44px touch target) — Tap to increment/decrement the live passenger count.
- **Visual capacity bar** — Turns green → amber → red as the bus fills.
- **Current count display** — Shows `currentPax / maxCapacity` with live aria announcements.

### SOS / Escalation

If you encounter an emergency (bus breakdown, safety issue, medical incident):

1. Tap the red **SOS / Escalation** button below the headcount card.
2. The trip is immediately flagged with `is_sos = true`.
3. The Admin Control Room dashboard will show a flashing red alert.
4. Tap again to clear the SOS flag once resolved.

### Offline resilience

- If your phone loses connectivity, headcount changes are queued in local storage.
- When the connection restores (browser `online` event), queued updates sync automatically.
- A red banner will indicate when the connection is lost.

---

## Guide: Admins / Control Room

The admin portal at `/admin` provides full fleet visibility and operational controls.

### Getting access

1. Navigate to `/admin` (redirects to `/login`).
2. Select **Admin / Control Room** from the portal dropdown.
3. Enter the admin passcode.

### Fleet Dashboard

- **SOS Alert Banner** — Any active SOS flags appear as a flashing red panel with bus ID, service, and location.
- **Stats Grid** — At-a-glance counts: Active buses, En Route, Completed, and SOS count.
- **Fleet Table** — All active trips with bus identifier, service, status badge, capacity fraction, and flags (SOS / Ad-hoc).

### Add Ad-Hoc Bus (Ghost Bus)

When demand exceeds planned capacity:

1. Click **"+ Add Ad-Hoc Bus"**.
2. Select the route, enter a bus identifier (e.g. `GHOST-01`), set capacity, and optionally add an operational note.
3. Click **Create Ghost Bus** — the trip appears immediately with `is_adhoc = true`.

### Bulk Shift Schedule

When events run late or traffic delays all buses on a route:

1. Open the **Bulk Shift Schedule** panel.
2. Select the affected route.
3. Enter delay in minutes (1–180).
4. Click **Apply Delay** — all non-completed trips on that route are marked `delayed` and the scheduled departure is shifted forward.

---

## Environment Variables

| Variable                          | Description                                   |
| --------------------------------- | --------------------------------------------- |
| `DATABASE_URL`                    | Neon Postgres connection string               |
| `NEXT_PUBLIC_WHATSAPP_INVITE_URL` | WhatsApp group invite link shown to delegates |
| `LO_PASSCODE`                     | Passcode for Liaison Officer portal           |
| `ADMIN_PASSCODE`                  | Passcode for Admin/Control Room portal        |

---

## Project Structure

```
src/
├── app/
│   ├── (delegate)/     # Public delegate portal (route group)
│   ├── admin/          # Admin control room
│   ├── api/            # Backend API routes
│   │   ├── auth/       # Passcode authentication
│   │   └── trips/      # Fleet CRUD operations
│   ├── display/        # FIDS signage mode
│   ├── lo/             # Liaison Officer portal
│   └── login/          # Authentication page
├── components/         # Shared UI components
├── db/                 # Drizzle schema, client, seed
├── hooks/              # React Query hooks (useLiveFleet)
└── lib/
    ├── i18n/           # Internationalization (13 languages)
    └── simulationEngine.ts  # Ported Monte Carlo simulation
```

---

## API Reference

| Method | Endpoint                | Description                               |
| ------ | ----------------------- | ----------------------------------------- |
| GET    | `/api/trips`            | Fetch all active trips joined with routes |
| PATCH  | `/api/trips/[id]`       | Update trip status, headcount, SOS flag   |
| POST   | `/api/trips/adhoc`      | Create an ad-hoc ghost bus trip           |
| POST   | `/api/trips/bulk-delay` | Shift all trips on a route by N minutes   |
| POST   | `/api/auth`             | Authenticate with event passcode          |
| DELETE | `/api/auth`             | Log out (clear session cookie)            |

---

## Scripts

| Command               | Description                   |
| --------------------- | ----------------------------- |
| `npm run dev`         | Start development server      |
| `npm run build`       | Production build              |
| `npm run start`       | Start production server       |
| `npm run lint`        | Run ESLint                    |
| `npm run db:generate` | Generate Drizzle migrations   |
| `npm run db:push`     | Push schema to database       |
| `npm run db:seed`     | Seed routes and initial trips |

---

## License

See [LICENSE](../LICENSE).
