# Nastavení: Supabase, GitHub Pages a iPhone

Jednorázové kroky, které musíš udělat ty (vyžadují tvůj účet).

## 1. Supabase ✅ projekt založený

- Projekt: `osobni-aplikace`, region Central EU (Frankfurt)
- Project ID: `nvjyxwsyrcslaruvqkkm`, URL: `https://nvjyxwsyrcslaruvqkkm.supabase.co`
- Veřejné údaje (URL a publishable klíč) jsou v [`.env.production`](../.env.production).
  Jsou veřejné záměrně, data chrání pravidla Row Level Security.

Zbývá v Supabase:

1. **Napojení na GitHub:** Project Settings → Integrations → GitHub
   - Working directory: `.`
   - Deploy to production: **zapnuto**, Production branch name: **`main`**
   - *Enable integration*
   - Supabase pak sám nahraje tabulky ze `supabase/migrations/` po každé změně na `main`.
     **Tabulky proto nezakládej ručně v SQL Editoru.**
2. **Tvůj uživatel:** Authentication → Users → *Add user* → *Create new user*
   (e-mail + heslo, zaškrtni *Auto Confirm User*)
3. **Vypnutí registrace:** Authentication → Sign In / Providers → vypni *Allow new users to sign up*
4. **Adresa appky:** Authentication → URL Configuration → *Site URL* =
   `https://michaelbedna13.github.io/osobni-aplikace/`

Přístupový token Supabase ani heslo k databázi do GitHubu dávat **není potřeba**,
tabulky nahrává integrace Supabase ↔ GitHub.

## 2. GitHub

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Appka se nasazuje z větve **`main`**. Po každém pushi na `main` workflow
   *Nasazení na GitHub Pages* sestaví appku a zveřejní ji na
   `https://michaelbedna13.github.io/osobni-aplikace/`

## 3. iPhone

1. Otevři `https://michaelbedna13.github.io/osobni-aplikace/` v **Safari**
2. Sdílet → **Přidat na plochu**
3. Spusť appku z plochy a přihlas se e-mailem a heslem z kroku 1.2

## 4. Import dat z původních appek

V appce: **Profil → Import ze zálohy → Vybrat soubor** a pak **Importovat**.
Funguje pro zálohu piv (`piva-….json`) i Hláškomatu (`hlaskomat-zaloha-….json`).
Import jde spustit opakovaně, nic se nezdvojí.

## Vývoj na počítači (volitelné)

```bash
npm install
npm run dev                  # http://localhost:5173/osobni-aplikace/ – ukázkový režim bez přihlášení
cp .env.production .env.local && npm run dev   # vývoj proti skutečnému Supabase
```
