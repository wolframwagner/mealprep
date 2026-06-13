# Mealprep App Integration Guide

## Weekly Process Workflow

This document outlines the core weekly meal-prep process that the app must
implement. Reference `mealprep_data.json` for specific weekly plans.

### 1. Weekly Proposal Generation
- Fetch `mealprep_data.json` to retrieve available themed weeks
- Apply rotation rules (cannot repeat protein/carb combo from previous week)
- Filter combinations based on:
  - Budget feasibility (check `budget_eur` per week)
  - Store availability (user-defined Denns/Rewe access)
- Present 1–4 options with macronutrient highlights
- Render `theme`, `protein_base`, `carb_base` in the user's active locale
  (resolve `theme_i18n[locale]` with fallback to `theme_i18n.de`)

### 2. Shopping List Management
- Parse `shopping_lists` from `mealprep_data.json` by store
- Allow user input for IST quantities
- Generate difference report (labels localized via `messages/<locale>.json`):
  ```
  Planned: 200g Soy strips
  Actual:  150g (Substituted with 100g Tofu)
  Impact:  -25g protein
  ```
- Recalculate macros using `mealprep_concept.md` logic
- Ingredient and category names come from the i18n objects on each item

### 3. Cooking Instructions
- Generate step-by-step guide matching kitchen constraints (e.g. single stove
  plate → sequential phases)
- Step labels and timing units (`min`, `h`) localized via `messages/<locale>.json`
  and `Intl.NumberFormat`
- Batch cooking instructions if needed

### 4. Portioning & Storage
- Calculate final portions using actual cooked weights
- Map to container sizes (glass containers)
- Generate daily serving variations, with portion labels in the active locale

### 5. Macro Tracking
- Maintain running totals for P/C/F/kcal
- Alert on significant deviations (e.g. -10g protein)
- Alert copy and thresholds come from the locale message files
  (`tracking.alert.protein_low`, `tracking.alert.kcal_high`, ...)

## Internationalization Touchpoints

The integration must be locale-aware at every step:

| Step | Localized content | Source |
|------|-------------------|--------|
| Weekly proposal | theme, protein_base, carb_base | `weeks.*_i18n` JSONB |
| Shopping list rows | ingredient name, category | `week_ingredients.*_i18n`, items in `shopping_lists` |
| Difference report | labels ("Planned", "Actual", "Impact") | `messages/<locale>.json` |
| Cooking steps | step text, units, timers | `messages/<locale>.json` + `Intl.*` |
| Macro alerts | alert message + threshold display | `messages/<locale>.json` |

The integration layer receives the active locale as a parameter (resolved per
`mealprep_concept.md` § Language preference) and never assumes a single
language. When seeding the dev DB, the i18n JSON is inserted as-is; the API
selects the active locale at response time.

## Data File Reference

The full weekly data is stored in `mealprep_data.json`. Translatable fields
are nested objects with `de` and `en` keys; numeric fields stay scalar:

```json
{
  "week": "W1",
  "theme": { "de": "...", "en": "..." },
  "protein_base": { "de": "...", "en": "..." },
  "carb_base": { "de": "...", "en": "..." },
  "protein_g": 193,
  "kcal": 1980,
  "budget_eur": 39.54
}
```
