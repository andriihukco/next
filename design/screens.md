# Screens

Each mobile screen, top to bottom. Pages follow one order: what it is, one line of context, the primary action, then sections from most to least used.

## map
**Мапа** (tab 1). The full-screen map. Top: «Львів Beta» pill (long-press for 5 s opens the dev tools) and the profile avatar. Right column: map type and my location, compass, camera, layers. During an air alert, the alert pill sits under the top bar and shelters show on the map. Tapping a vehicle, stop, place or shelter highlights it and opens its page.

## transport
**Транспорт** (tab 2). Large title.
1. Simulation banner, only when the data is simulated.
2. Filter chips with counts: Усі, Автобуси, Трамваї, Тролейбуси, Таксі (shown only when present).
3. **Зупинки поруч**: the five nearest stops with distance, or «Знайти зупинки поруч» to allow location.
4. **Маршрути на лінії**: one row per route, with destination, vehicle type and count on the line → route page.
Footer: GPS source, arrival times are estimates.

## route
**Маршрут N.** Route badge and destination. **На лінії: N**: each vehicle with plate and distance → vehicle page.

## vehicle
**Автобус 46.** Route badge and destination, «Наживо · GPS» and «Низька підлога» badges, «Показати на мапі» (tonal). **Дані**: type and plate. **Зупинки маршруту поруч**: the nearest stops on its route → stop page.

## stop
Stop name and context (routes, distance). «Показати на мапі». Then, as sections instead of the web's tabs: **Маршрути тут**, **Транспорт поруч** (estimated minutes → vehicle page), **Розклад** (only with a timetable), **Зручності**, **Контакти**, **Оцінка пасажирів** (only with data). A section without data shows a one-line footer, or is left out.

## places
**Місця** (tab 3). Large title with search in the header.
1. Category tiles: Популярне, Поруч (with location), then the categories present.
2. **Знайдено: N** with Список or Сітка.
3. List: icon tile, name, category and address, distance → place page. Grid: color tiles.
4. «Показати ще» after 40.
Empty: «Наблизьте мапу», with «Відкрити мапу».

## education
**Освіта** (tab 4). Tiles: Школи, Садочки, Університети, Курси, Бібліотеки. A list of that kind, nearest first → place page.

## place
Category orb, category and distance, the name as a large title, the address. **Маршрут** (filled) and **На мапі** (tonal). **Контакти** (phone, site), **Інформація** (opening hours and other tags), then photos and reviews when a source exists.

## shelter
Address, «Найближче до вас» and «Цілодобово» badges, «Показати на мапі» (filled: in an alert this is the main action). **Дані**: type, district, status, capacity, distance.

## services
**Послуги** (tab 5). A «Демо» card for groceries with «Почати». **Усі сервіси**: one row per service → its flow. Footer: nothing is sent.

## service
The flow fills the page with its own steps and back control. Every step keeps the «Демо» label. The final step says nothing was sent.

## profile
Opened from the avatar. One grouped block for your profile and account. **Вигляд** (Системна, Світла, Темна), **Дозволи**, **Сповіщення** (disabled, «Незабаром»), **Про застосунок** (replay the tour, walk demo, design library), then «Очистити дані на пристрої» on its own.

## profile-edit
Name, who you are in the city (chips), home and work districts, «Зберегти». Stored on the device only.

## account
Signed out: Вхід or Реєстрація, email, password, the primary button, «Забули пароль?». Signed in: who you are, «Вийти», and «Видалити обліковий запис» behind the launch guard.

## design
The mobile design library. An iOS and Android switch, then type, color, buttons, filters, lists, badges and empty state.
