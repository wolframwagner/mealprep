# Mealprep App Concept

## Architecture

- **Stack**: Next.js on Vercel (free), Postgres DB external (Supabase free tier), NextAuth with email/password
- **API**: API routes as the central interface — later consumable by Flutter as well
- **Offline**: PWA with offline caching (shopping list / cooking instructions usable without internet)
- **i18n**: Server-rendered locale via cookie, client-side translations in `messages/en.json` / `messages/de.json`

## Data Model

See `mealprep_data.json` for the 6 weeks of seed data (now with i18n fields).

### Tables
- `users` (id, email, name, `preferred_language` CHAR(2))
- `weeks` (id, week_number, `theme_i18n` JSONB, `protein_base_i18n` JSONB, `carb_base_i18n` JSONB, protein_g, kcal, budget_eur)
- `week_ingredients` (week_id, `ingredient_name_i18n` JSONB, amount_g, `category_i18n` JSONB)
- `sauces` (id, week_id, `name_i18n` JSONB, recipe, day_of_week)
- `shopping_lists` (week_id, store, items JSON)
  - items: `{ ingredient_name_i18n: {...}, amount_g, category_i18n: {...} }`
- `user_progress` (user_id, week_id, day_offset, completed_ingredients JSON)

Translatable text columns store `{"de": "...", "en": "..."}`. Non-translatable
columns (numeric values, FK ids, enums) stay scalar.

## Core Processes

1. **Week start**: User picks the current week (manual, not auto-rolling)
2. **Shopping**: SOLL quantities from the plan, user enters IST (quantity / ingredient swap)
3. **IST correction**: On deviation → recalculate macros, portion sizes, cooking instructions
4. **Cooking guide**: Mobile checklist, quantities scale automatically
5. **Day tracking**: Bases + sauces checked off

## Nutrition Logic

- Bundeslebensmittelschlüssel (BLS) as the data source
- ~30–40 relevant ingredients to start
- Substitutions (e.g. tofu instead of seitan) with nutrition data → automatic adjustment

## Internationalization

### Scope (v1)
Two locales: **`en`** and **`de`**. Everything the user sees in the UI is
translated, including:
- Static UI strings (buttons, labels, headings, validation messages)
- Week themes, protein bases, carb bases
- Ingredient names, categories, units
- Sauce names

Non-translatable: numeric values, dates, times, units of measure (formatted per
locale — see below), enum-like fields (day_of_week, store names until those are
moved into i18n as well).

### Language preference
- Source of truth: `users.preferred_language` (CHAR(2), `CHECK IN ('en','de')`, default `null`)
- Mirror in `localStorage` under key `mealprep.lang` for instant PWA load
- On login / app boot, resolution order:
  1. `localStorage` value (if present and valid)
  2. `users.preferred_language` (if logged in)
  3. `Accept-Language` header parsing (en if any `en*` is preferred, else de)
  4. Hard fallback: `de` (matches the original content language)
- A user who has never picked a language gets an unobtrusive one-time prompt
  ("Sprache / Language") on first visit. Skipping it keeps the detected default.

### UI translation files
Flat key-based JSON, one file per locale:

```
messages/
  en.json
  de.json
```

Keys are namespaced with dots for readability, kept flat on disk:

```json
{
  "common.save": "Save",
  "common.cancel": "Cancel",
  "shopping.title": "Shopping list",
  "shopping.add_item": "Add item",
  "shopping.diff.planned": "Planned: {amount}",
  "shopping.diff.actual": "Actual: {amount}",
  "shopping.diff.impact": "Impact: {delta} protein",
  "cooking.step": "Step {n} of {total}",
  "tracking.day": "Day",
  "tracking.completed": "Completed"
}
```

Interpolation uses `{name}` placeholders. No ICU plurals in v1 — use separate
keys per plural form (`item.one`, `item.other`) only if needed.

### Data i18n
Translatable text inside the data model is stored as JSONB with a `de` and
`en` key on every row. The seed file `mealprep_data.json` follows the same
shape. Example:

```json
{
  "week": "W1",
  "theme": { "de": "Mediterran-orientalisch", "en": "Mediterranean–Middle Eastern" },
  "protein_base": { "de": "Seitan + rote Linsen", "en": "Seitan + red lentils" },
  "carb_base": { "de": "Bulgur", "en": "Bulgur" },
  "protein_g": 193,
  "kcal": 1980,
  "budget_eur": 39.54
}
```

The API returns the JSONB object as-is. The client picks `payload[locale]`
with fallback to `payload.de ?? payload.en` if a key is missing.

### Locale-aware formatting
- **Numbers**: `Intl.NumberFormat` (de: `1.234,56`, en: `1,234.56`)
- **Currency**: EUR via `Intl.NumberFormat` with `style: 'currency'`
- **Dates**: `Intl.DateTimeFormat` (de: `dd.MM.yyyy`, en: `yyyy-MM-dd`)
- **Weights**: locale-formatted number + `g` / `kg` unit (units themselves are
  not translated in v1; could be moved into i18n if/when `lb`/`oz` support is added)
- **Plurals**: defer to `Intl.PluralRules` if a key is missing and an explicit
  plural form is required

### Adding a new locale (future)
1. Add `messages/<locale>.json` (copy `en.json`, translate values)
2. Extend the `CHECK` constraint on `users.preferred_language`
3. Add the locale to the `LOCALES` constant and to the `Accept-Language` parser
4. Backfill `*_i18n` rows: existing rows get `{"de": "<existing>"}`; the new
   locale is `null` until translated. UI must handle the `null` case (fall back
   to `de` or `en` and show a "needs translation" badge in admin views).

### Libraries
- Next.js App Router built-in i18n routing OR a lightweight `next-intl` /
  `react-intl` wrapper. Decision deferred to implementation phase; the file
  layout above works with either.

## Features

- [x] Login (email + password)
- [x] Week plan view (checklist)
- [x] Shopping list with SOLL/IST tracking
- [x] Cooking instructions with scaled quantities
- [x] Macro recalculation on IST deviation
- [x] PWA offline mode
- [x] Language selector (en / de) with persistence
- [x] Locale-aware number / date / currency formatting

## Roadmap

1. Next.js project + Supabase schema (with `*_i18n` columns and `users.preferred_language`)
2. Seed data import (`mealprep_data.json` with i18n objects)
3. `messages/en.json` and `messages/de.json` extraction from existing copy
4. Auth + user accounts (incl. language preference field)
5. i18n provider + language selector UI + first-visit prompt
6. Week plan UI
7. Shopping list with tracking
8. Cooking instructions
9. Offline caching (PWA), with translations bundled in the service worker cache
