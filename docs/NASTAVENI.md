# Nastavení: Supabase, GitHub Pages a iPhone

Jednorázové kroky, které musíš udělat ty (vyžadují tvůj účet). Zabere to asi 15 minut.

## 1. Supabase

1. Na [supabase.com](https://supabase.com) založ nový projekt
   - název: `osobni-aplikace`, region: **Central EU (Frankfurt)**
   - heslo k databázi si ulož – bude potřeba v kroku 2
2. **Vytvoř si uživatele:** Authentication → Users → *Add user* → *Create new user*
   (e-mail + heslo, zaškrtni *Auto Confirm User*)
3. **Vypni registraci:** Authentication → Sign In / Providers → vypni *Allow new users to sign up*
   (do appky se pak dostaneš jen ty)
4. **Opiš si hodnoty:**
   - *Project ID*: Project Settings → General (je i v adrese: `supabase.com/dashboard/project/<ID>`)
   - *Project URL*: `https://<Project ID>.supabase.co`
   - veřejný klíč: Project Settings → API Keys → *Publishable key* (`sb_publishable_…`),
     případně starší *anon* klíč v záložce *Legacy API Keys*
   - doporučeno: Authentication → URL Configuration → *Site URL* =
     `https://michaelbedna13.github.io/osobni-aplikace/`
5. **Přístupový token pro GitHub:** [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) → *Generate new token*

## 2. GitHub

V repozitáři `osobni-aplikace`:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. **Settings → Secrets and variables → Actions**
   - záložka *Variables* → *New repository variable*:

     | Název | Hodnota |
     |---|---|
     | `VITE_SUPABASE_URL` | Project URL ze Supabase |
     | `VITE_SUPABASE_ANON_KEY` | veřejný klíč (publishable / anon) |
     | `SUPABASE_PROJECT_ID` | Project ID |

   - záložka *Secrets* → *New repository secret*:

     | Název | Hodnota |
     |---|---|
     | `SUPABASE_ACCESS_TOKEN` | token z kroku 1.5 |
     | `SUPABASE_DB_PASSWORD` | heslo k databázi z kroku 1.1 |

3. Appka se nasazuje z větve **`main`**. Po každém pushi na `main`:
   - *Nasazení na GitHub Pages* sestaví appku a zveřejní ji na
     `https://michaelbedna13.github.io/osobni-aplikace/`
   - *Migrace databáze Supabase* nahraje nové tabulky ze `supabase/migrations/`

> Veřejný klíč Supabase je vidět v kódu stránky. To je v pořádku a tak je to navržené:
> data chrání pravidla Row Level Security, bez přihlášení nikdo nic nepřečte.

**Tabulky nezakládej ručně.** Vytvoří je GitHub (workflow *Migrace databáze Supabase*).
Kdyby se stejné SQL spustilo ručně v *SQL Editoru*, automatická migrace by pak skončila chybou,
protože tabulka už existuje. Ruční cesta má smysl jen tehdy, když `SUPABASE_PROJECT_ID`
v GitHubu vůbec nenastavíš – pak spouštěj soubory ze `supabase/migrations/` popořadě ručně.

## 3. iPhone

1. Otevři `https://michaelbedna13.github.io/osobni-aplikace/` v **Safari**
2. Sdílet → **Přidat na plochu**
3. Spusť appku z plochy a přihlas se e-mailem a heslem z kroku 1.2

## Vývoj na počítači (volitelné)

```bash
npm install
cp .env.example .env.local   # doplň URL a klíč ze Supabase
npm run dev                  # http://localhost:5173/osobni-aplikace/
```

Bez `.env.local` běží appka v ukázkovém režimu (bez přihlášení, nastavení jen v prohlížeči).
