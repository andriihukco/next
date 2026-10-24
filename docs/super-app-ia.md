# next — Super-app information architecture and flows

Status: proposal, implemented in phase 1 (2026-10-24). Companion to [DESIGN.md](../DESIGN.md).
Scope: how the app is organized, how each vertical gets its own flow, and what is demo data.

## 1. Why

The app opens on a map and lists places under it. Every service (order food, book a table, book a doctor, buy a ticket) would become another form inside the same panel. That does not scale to the verticals people use daily, and each vertical has its own proven pattern (Glovo for delivery, Doctolib for clinics, Uber for taxi, a cinema site for seats).

Principles for the super-app:

1. **Map stays home.** «Місто» (map, transport, places) is still the default. Verticals do not replace it.
2. **One vertical, one flow.** Each service has its own step sequence that matches how people buy that thing. Shared parts (stepper, summary, confirmation, cart) are components, not copies.
3. **Honest data.** Every vertical is demo until a provider is connected. The header shows «Демо». The confirmation says nothing was sent.
4. **Same place for the same action.** A list can be shown as a map, a list, or a grid. A flow always ends on the same confirmation pattern.

## 2. Information architecture

```
Місто (home: map + transport + places)
├── Карта / Список / Сітка     ← view switch on the places list
├── Транспорт, Місця, Освіта, Події, Послуги, Робота, Нерухомість …  (existing sections)
└── Профіль (header)

Сервіси (header button, opens the services hub)
├── Продукти       → shop flow        (take away or delivery)
├── Доставка       → shop flow        (restaurant menu → cart → delivery)
├── Ресторани      → table flow       (book a table, optional pre-order)
├── Лікарі         → appointment flow (specialty → doctor → slot → patient)
├── Кіно           → cinema flow      (film → session → seats → checkout)
├── Спортзали      → membership flow  (gym → plan → start date)
└── Таксі          → taxi flow        (route → car class → request)

Later (phase 2+): Новини (feed), Спільнота (social), bottom tab bar (see §6, D6)
```

Why a hub and not a bottom tab bar yet: the rail is a bottom sheet on mobile and already carries the map. Adding a fifth top-level tab means changing the shell layout, which is a product decision (D6). The hub works without touching the shell and can become the tab bar later.

## 3. Views for lists: map, list, grid

Any place list can be shown three ways:

| View | What it shows | Who uses it |
|---|---|---|
| Карта | Places as pins on the live map (`activeView = map`) | People who want to see where things are |
| Список | Row cards with photo thumbnail, title, subtitle, meta (current layout) | Scanning, reading hours and ratings |
| Сітка | Cards in a grid, photo on top | Visual browsing (restaurants, gyms, cinemas) |

- The control is a row of three `Chip`s above the list, each with `aria-pressed`. «Карта» leaves the list and opens the map; it is never shown as selected.
- The list/grid choice is remembered on the device (`eway-places-layout`).
- Phase 1 applies the switch to «Місця». Other lists stay as lists until phase 2.

## 4. Vertical flows

Each flow lists its steps and what the last step does. All flows show a «Демо» chip, and their final step says nothing was sent.

### 4.1 Shop (Продукти, Доставка) — pattern: Glovo, Silpo
1. **Catalog.** Category chips, product rows with a quantity stepper. A sticky cart bar shows count and total.
2. **Cart.** Lines, quantity changes, total. Empty cart cannot continue.
3. **Checkout.** Choose **Самовивіз** (pick-up at a store) or **Доставка** (address and time window). Choose a payment method (label only, no card entry).
4. **Confirm.** Order number (demo), what happens next, ETA.

### 4.2 Table (Ресторани) — pattern: TheFork, Google reserve
1. **Restaurant.** Name, cuisine, address, opening hours.
2. **Date, time, guests.** Date chips for the next 7 days, time slots, party size.
3. **Pre-order (optional).** Menu with quantity steppers. Skipping is one tap.
4. **Contact and confirm.** Name and phone, booking summary, confirm.

### 4.3 Appointment (Лікарі) — pattern: Doctolib
1. **Specialty.** Chips: терапевт, педіатр, стоматолог, офтальмолог, дерматолог.
2. **Doctor.** Name, clinic, next available slot.
3. **Slot.** Days and times. Unavailable slots are shown, not hidden.
4. **Patient.** Name, phone, date of birth (optional), reason for visit (optional).
5. **Confirm.** Booking summary with the clinic address, and a reminder that the clinic confirms by phone.

### 4.4 Cinema (Кіно) — pattern: cinema booking sites
1. **Film.** Poster, duration, age rating, description.
2. **Session.** Date and time by cinema and format (2D, IMAX).
3. **Seats.** Seat map, select up to 6 seats. Taken seats are disabled. The total updates live.
4. **Checkout.** Ticket type (regular, reduced), summary, confirm.
5. **Ticket.** Ticket summary with seats (demo QR area, no real code).

### 4.5 Membership (Спортзали) — pattern: gym apps
1. **Gym.** Name, address, hours, what's included.
2. **Plan.** Monthly, quarterly, annual. Shows price per month.
3. **Start.** Start date (from today) and a trial option when the gym offers one.
4. **Confirm.** Membership summary and what to bring.

### 4.6 Taxi (Таксі) — pattern: Uber, Bolt
1. **Route.** From (current location or pick a place) and to (pick a place). Swap button.
2. **Car class.** Economy, comfort, minivan. Each shows a fare estimate labeled «Оцінка» and an arrival time.
3. **Request.** Payment method, comment, request button. Shows a «Пошук водія» state.
4. **Status.** Demo state only. No driver is assigned.

## 5. Shared rules

- **Components:** every flow uses `FlowShell` (stepper, back, next, error line) and `Button`, `Chip`, `Input`, `Card` primitives. No raw form controls with bespoke styling.
- **Steps:** back never loses entered data within a flow. Closing the flow asks for confirmation only when something was entered.
- **Validation:** the next button is disabled with a reason in text. Errors use `role="alert"`, not color only.
- **Money:** UAH, formatted with `Intl.NumberFormat("uk-UA")`. Estimates are labeled «Оцінка».
- **Accessibility:** the stepper is an ordered list with `aria-current="step"`. Seat and slot pickers are button groups with `aria-pressed`.
- **Motion:** step changes use the spring from `src/lib/motion.ts`. Reduced motion removes movement only.

## 6. Open decisions

These need an owner's answer. Until then, the value in the middle column is what the code does.

| ID | Question | Current | Proposed |
|---|---|---|---|
| D6 | Navigation: keep the header hub, or move to a bottom tab bar on mobile? | Header hub | Keep hub until verticals reach phase 2; then decide with usage data |
| D7 | Which verticals are first to go live with a real provider? | All demo | Groceries and taxi first (highest frequency); needs provider contracts |
| D8 | Payments: which methods (card, Apple Pay, cash on delivery)? | Label only | Cash on delivery and card on file, once a payment provider exists |
| D9 | Social (Спільнота) and news: in scope for the same release? | Not in phase 1 | Separate phase, after the transactional flows are live |

## 7. Phasing

- **Phase 1 (this change):** IA, map/list/grid switch on places, services hub, six flows with demo data.
- **Phase 2:** wire the existing «Замовити», «Столик», «Записатися», «Квитки» buttons in `EntityDetail` to these flows; add grid/list switch to other lists; news feed.
- **Phase 3:** provider integration per vertical (one at a time), real availability, payment, order status tracking.
- **Phase 4:** social layer (profiles, saved places shared with friends) — after D9.

## 8. Data

- All catalogs, menus, doctors, films, gyms, and taxi classes come from `src/features/super-app/demo-data.ts` and are labeled «Демо» where they appear.
- Taxi fares and arrival times are estimates, labeled «Оцінка».
- Nothing is sent. Confirmation screens say so.
