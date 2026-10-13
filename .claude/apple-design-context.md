# Apple Design Context

Kontext pro skilly hig-* (Apple Human Interface Guidelines) v `.claude/skills/`.
Zdroj skillů: github.com/raintree-technology/apple-hig-skills (MIT, commit fdc3599).

## Product
- **Name**: untrois
- **Description**: Osobní appka pro jednoho člověka: moduly jako Dnes, Filmy a knihy, Trénink, Dech, Meditace, Vděčnost, Platby, Nákup, Narozeniny, Odkazy, Hláškomat, Cornhole.
- **Category**: Productivity / lifestyle (osobní deník a nástroje)
- **Stage**: Shipped, průběžně se ladí

## Platforms
| Platform | Supported | Min OS | Notes |
|----------|-----------|--------|-------|
| iOS      | Yes       | 16.4   | PWA přidaná na plochu (standalone), hlavní zařízení je iPhone |
| iPadOS   | No        |        |       |
| macOS    | No        |        | Jen náhled v prohlížeči při vývoji |
| tvOS     | No        |        |       |
| watchOS  | No        |        |       |
| visionOS | No        |        |       |

## Technology
- **UI Framework**: Web, ne SwiftUI/UIKit. Vite + React + TypeScript, data v Supabase. Rady z HIG převádět do HTML/CSS/React, ne do Swiftu.
- **Architecture**: Single-window PWA, HashRouter, swipe zpět vlastní implementací (`src/lib/swipeBack.ts`).
- **Apple technologies**: Web Push (iOS 16.4+), Badging API, audioSession (iOS 17+), Zkratky (sdílení odkazů).

## Design System
- **Base**: Vlastní design system, popsaný v `docs/DESIGN.md` (a `PRODUCT.md`). Má přednost před obecnými radami HIG; HIG slouží k ověření ergonomie, ne k přepsání vizuálního stylu.
- **Brand Colors**: Viz frontmatter `docs/DESIGN.md`. Výchozí vzhled „Černý“ (off-black + krémová, jemný nádech barvy modulu), další vzhledy Barevný a duotóny.
- **Typography**: Vlastní písma (ne SF Pro), viz `docs/DESIGN.md`.
- **Dark Mode**: Řešené přes vzhledy (`html[data-theme]`), ne přes systémové nastavení.
- **Dynamic Type**: Ne, pevná velikost písma.
- **Language**: Čeština (UI texty i komunikace s uživatelem).

## Accessibility
- **Target Level**: Baseline (kontrast WCAG AA, dotykové cíle aspoň 44 pt, popisky ovládacích prvků, Reduce Motion).

## Users
- **Primary Persona**: Jeden uživatel, používá appku na iPhonu během dne, často jednou rukou.
- **Key Use Cases**: Rychlý zápis (minuty dechu, vděčnost, film), přehled dne, připomínky přes upozornění, trénink s odpočtem.
- **Known Challenges**: Plynulost přechodů ve standalone PWA, chování iOS Safari (safe areas, status bar, zvuk v tichém režimu).
