# Osobní aplikace – koncept

> Stav: **koncept v0.2** · design: [docs/DESIGN.md](DESIGN.md) · další krok: Fáze 0
>
> Nápady na další funkce modulů: [NAPADY.md](NAPADY.md)
>
> Rozhodnuto: **iPhone**, kód na **GitHubu**, data v **Supabase**, styl **minimalismus + neo brutalismus + Bauhaus**.

## 1. Co to je

Osobní mobilní „appka“, která je ve skutečnosti **web (PWA)**. Přidáš si ji na plochu telefonu,
spouští se na celou obrazovku bez lišty prohlížeče a chová se jako nativní aplikace.
Data jsou v **Supabase** (přihlášení, databáze, soubory), takže jsou stejná na mobilu i na počítači.

### Principy

1. **Zápis do 2 tapů.** Pokud zapsání piva nebo hlášky trvá déle než pár sekund, nebudeš to dělat.
   Každý modul má „rychlou akci“ dostupnou odkudkoli.
2. **Nejdřív sběr, pak statistiky.** Statistiky jsou odměna – ale jen když se data sbírají bez tření.
3. **Jeden uživatel.** Žádná sociální vrstva, žádné sdílení. Registrace v Supabase bude vypnutá.
4. **Moduly se sdíleným základem.** Cíle, štítky, vyhledávání a statistiky fungují napříč moduly
   stejně, takže každý další modul je levnější.
5. **Tmavý režim a čeština** od začátku.

---

## 2. Moduly

Moduly se dají rozdělit do dvou typů, což výrazně zjednodušuje stavbu:

| Typ | Co to je | Moduly |
|---|---|---|
| **Záznamy v čase** (log) | „Něco se stalo v čase X“ → počty, streaky, grafy | Piva, Meditace, Trénink, Finance, Hláškomat, Deník |
| **Sbírky se stavem** (list) | „Položka, kterou chci / mám hotovou“ → seznamy, filtry | Odkazy, Filmy, Knihy, Místa, Wishlist, Dárky |
| **Lidé** | Osoby, na které se ostatní moduly odkazují | Narozeniny, Dárky, autor hlášky, „doporučil mi“ |

### 2.1 Hláškomat 💬 ✅ *hotovo*
Převzato z původního Hláškomatu (Netlify), včetně importu zálohy hlášek.

- Hláška: text, kdo to řekl, kontext, datum, ★ oblíbená
- Zapsání a úprava hlášky (našeptávání autorů a kontextů podle předchozích hlášek), smazání
- Hledání bez ohledu na diakritiku, filtry Vše / Oblíbené / podle autora
- Žebříček „Kdo má nejvíc hlášek“
- **Hláška dne** na obrazovce Dnes (každý den jiná)
- Později: autor propojený s modulem Lidé, hláška jako obrázek do chatu

### 2.2 Trénink 🏋️
Vlastní tréninky doma – s činkami, bez nich, kardio.

- **Knihovna cviků:** název, kategorie (činky / vlastní váha / kardio / protažení),
  typ měření (opakování, opakování + váha, čas, vzdálenost)
- **Šablony tréninků** („Doma – horní polovina“, „Bez činek 20 min“)
- **Záznam tréninku:** spustíš šablonu → odklikáváš série, předvyplní se čísla z minula
- Časovač pauzy mezi sériemi
- Statistiky: počet tréninků týdně, objem (kg × opakování), osobní rekordy, progres u cviku,
  heatmapa aktivity (jako GitHub)
- Cíl: např. „3 tréninky týdně“

### 2.3 Meditace 🪷 ✅ *hotovo*

- **Časovač** 5/10/15/20/30 min nebo bez omezení, gong na začátku a konci, displej zůstává rozsvícený
- Čas se počítá z časových značek: sedí i po zamčení telefonu nebo zavření appky,
  meditace se po návratu sama dokončí a uloží
- Pozastavit / pokračovat, ukončit a uložit, zrušit bez uložení
- Spuštění jedním ťuknutím z karty na obrazovce Dnes (naposledy zvolená délka)
- **Historie** po týdnech s délkou každé meditace; úprava, smazání, přidání zpětně, poznámka
- **Cíl** X× týdně (výchozí 5), tečky dnů tohoto týdne, série týdnů se splněným cílem
- Statistiky: minuty tento týden a měsíc, hodiny celkem, průměrná a nejdelší meditace,
  minuty za posledních 12 týdnů
- Později: dechová cvičení, zápis do Apple Zdraví přes Zkratku

### 2.4 Odkazy 🔗
Inspirace, videa, grafika, články.

- Uložení URL → automaticky se stáhne **název, obrázek a popis** (Open Graph náhled přes
  Supabase Edge Function)
- Kategorie: inspirace / video / grafika / článek / nástroj + vlastní štítky
- Stav: 📥 k prohlédnutí → ✅ hotovo, ⭐ oblíbené
- Zobrazení jako mřížka obrázků (moodboard) nebo seznam
- **Sdílení z jiné aplikace přímo do appky** (Web Share Target): na Androidu funguje přímo
  z menu „Sdílet“, na iPhonu přes Zkratku (Shortcuts)

### 2.5 Piva 🍺 ✅ *hotovo*
Jen počítadlo, každé pivo je půllitr (0,5 l). Druhy piv se nezapisují.

- **Velké tlačítko „+1 pivo“** na stránce Piv i přímo na kartě na obrazovce Dnes;
  po zápisu jde krok vrátit („Zpět“)
- Úprava času nebo smazání zápisu, přidání piva zpětně
- Statistiky: dnes, tento týden, měsíc, letos, celkem; graf tohoto týdne po dnech;
  posledních 12 týdnů; **podle dne v týdnu** (průměr i celkem, se zvýrazněným dnem, kdy piješ nejvíc);
  průměr za den a týden, rekordní den a týden
- Import zálohy z původní appky (Profil → Import ze zálohy)

### 2.6 Finance 💰 – dávají smysl?
**Ano, ale v „lehké“ verzi.** Plnohodnotné účetnictví výdajů se ručně udržet nedá a
bankovní aplikace už kategorizaci výdajů umí. Co v osobní appce dává smysl:

1. **Předplatné** – Netflix, Spotify, iCloud, posilovna… kolik to dělá měsíčně/ročně a kdy se co
   obnovuje. Malá práce, velký přehled. ← **doporučuji začít tímto**
2. **Spořicí cíle** – „Dovolená 30 000 Kč“, ruční vklady, progres bar
3. **Rychlé výdaje (volitelně)** – jen pro vybrané kategorie, které chceš sledovat
   (např. jídlo venku, piva – ty se sečtou automaticky z modulu Piva)
4. **Import CSV z banky (později)** – měsíčně nahrát výpis, appka ho roztřídí a ukáže přehled

Napojení přímo na banku (PSD2) nedoporučuji – je to složité a pro osobní appku neúměrné.

### 2.7 Filmy, seriály a knihy 🎬📚
Watchlist a readlist.

- Hledání přes **TMDB** (filmy/seriály – plakáty, rok, žánr) a **Open Library / Google Books**
  (knihy – obálky, autor) → nemusíš nic vypisovat ručně
- Stavy: chci vidět/přečíst → rozkoukané/rozečtené → hotovo (+ datum, hodnocení, poznámka)
- Doporučil mi: kdo (hodí se, až se tě někdo zeptá)
- Statistiky: přečtené knihy a filmy za rok, **čtenářský cíl** („20 knih v roce 2027“)

### 2.8 Mapa míst 🗺️ – jde to?
**Ano, a je to jeden z nejpraktičtějších modulů.**

- Interaktivní mapa (MapLibre / Leaflet + OpenStreetMap – zdarma, bez Google účtu)
- Přidání místa: **dlouhým stiskem na mapu**, vyhledáním adresy/názvu, nebo „tady, kde stojím“
- Kategorie s vlastní ikonou a barvou: chci navštívit, navštíveno, výlet, hospoda, jídlo, příroda…
- U místa: poznámka, odkaz, fotky, kdy jsem tam byl, hodnocení
- **Seznamy / plány:** „Víkend v Jeseníkách“ = seskupená místa + poznámky, případně datum
- Propojení: piva zapsaná s polohou se ukážou na mapě („kde všude jsem pil“)
- Import uložených míst z Google Maps (Google Takeout → soubor s místy)

### 2.9 Lidé, narozeniny a dárky 🎂🎁
Přehled o narozeninách kamarádů a nápady na dárky během celého roku.

- **Lidé:** jméno, datum narozenin (rok volitelně → appka ukáže „bude mu 30“), poznámka,
  fotka, skupina (rodina / kamarádi / práce)
- **Kalendář narozenin:** seznam „nejbližší narozeniny“ + měsíční přehled; na obrazovce Dnes
  upozornění pár dní předem
- **Nápady na dárky:** u každého člověka seznam nápadů (název, odkaz, cena, poznámka)
  – zapisuješ průběžně, když tě něco napadne
- Stav dárku: 💡 nápad → 🛒 koupeno → 🎁 darováno (+ rok a příležitost: narozeniny, Vánoce, …)
  → příště víš, co už dostal
- **Připomínky na iPhonu:** appka vygeneruje **kalendářový odběr (.ics)**, který si přidáš do
  Kalendáře na iPhonu → narozeniny se ukážou v nativním kalendáři i s upozorněním.
  Je to spolehlivější než push notifikace z webu a nic to nestojí.
- Propojení: lidé jsou společní pro celou appku – autor hlášky, „doporučil mi“ u filmu,
  s kým jsem byl na pivu (volitelně)

### 2.10 Deník a vděčnost 📓
- **Za co jsem dnes vděčný?** 1–3 věci denně. Tahle otázka je na obrazovce Dnes.
- Každý den jedno políčko: **jedna věta + nálada 1–5** (tapnutím na tvar)
- Na obrazovce Dnes jako výzva: „Jaký byl dnešek?“ – vyplníš za 10 sekund
- Kalendář s náladou po dnech (barevná mozaika roku)
- **„Před rokem / před dvěma lety“** – co jsi psal tentýž den
- Volitelně fotka dne

### 2.11 Wishlist 🛍️
- Věci, co chci koupit: název, odkaz (náhled se stáhne jako u Odkazů), cena, priorita
- Stav: chci → čekám na slevu → koupeno / už nechci
- Součet „kolik by stálo všechno“ a napojení na spořicí cíl (Finance)
- Tip: položku jde „poslat“ do Dárků jako nápad pro sebe (když se tě někdo zeptá, co chceš)

---

## 3. Co se ještě hodí (další návrhy)

Seřazeno podle poměru užitek / náročnost:

| Nápad | Proč | Náročnost |
|---|---|---|
| **Návyky** ✅ | Obecný tracker (voda, protažení, bez telefonu po 22:00). Meditace a trénink jsou vlastně specializované návyky – sdílí stejný systém cílů. | střední |
| **Recepty** 🍳 | Uložené recepty (i z odkazu) + „co uvařit“. | střední |
| **Sbírka „poprvé“ / zážitky** 🌟 | Koncerty, akce, zážitky s datem a fotkou – časová osa života. | nízká |

Doporučuji nepřidávat vše najednou – nejdřív ověřit, které moduly opravdu používáš.

---

## 4. Průřezové funkce (sdílený základ)

Tohle se postaví jednou a všechny moduly to využijí:

- **Obrazovka „Dnes“** – nahoře pás **„Moje moduly“**: připnuté moduly vedle sebe, posun do boku,
  na každé kartě hlavní číslo, plnění cíle a rychlá akce (+1 pivo, spustit meditaci…).
  Pod ním hláška dne, nejbližší narozeniny a **„Za co jsem dnes vděčný?“**.
- **Rychlé přidání (+)** – spodní panel s akcemi: +1 pivo, hláška, odkaz, start meditace,
  start tréninku, místo
- **Cíle a streaky** – jeden systém pro všechny moduly: *co* (počet/minuty/částka),
  *za jaké období* (den/týden/měsíc/rok), *minimum nebo maximum*
  - meditace ≥ 5× týdně · trénink ≥ 3× týdně · piva ≤ 10 týdně · knihy ≥ 20 ročně
- **Štítky** a **globální vyhledávání** napříč moduly
- **Statistiky** – každý modul má vlastní, plus společný „Rok v kostce“
- **Import / export** – CSV import pro data, která už někde máš; export všeho do JSON (záloha)

---

## 5. Navigace

Spodní lišta, maximálně 5 položek (víc je na mobilu nepřehledné):

```
┌─────────────────────────────────────────┐
│  Dnes │ Moduly │  (+)  │ Mapa │ Profil  │
└─────────────────────────────────────────┘
```

- **Dnes** – dashboard (hláška dne, cíle, nejbližší narozeniny, deník)
- **Moduly** – mřížka všech modulů (každý má vlastní tvar a barvu); oblíbené nahoře
- **(+)** – rychlé přidání (vysune panel s akcemi)
- **Mapa** – vlastní záložka, protože je to celoobrazovkový zážitek
- **Profil** – cíle, nastavení, import/export, odhlášení

Každá obrazovka má vlastní URL (funguje tlačítko zpět a jde si udělat zkratku přímo na modul).

---

## 6. Technické řešení

| Vrstva | Doporučení | Proč |
|---|---|---|
| Frontend | **Vite + React + TypeScript** | rychlé, jednoduché, SPA stačí (není potřeba SEO ani server) |
| PWA | `vite-plugin-pwa` | manifest, ikona na plochu, offline cache |
| Styly | Tailwind CSS + vlastní design tokeny | rychlé ladění designu podle inspirace |
| Data v UI | TanStack Query + Supabase JS | cache, optimistické zápisy (tap → hned vidíš výsledek) |
| Backend | **Supabase**: Auth, Postgres, Storage, Edge Functions | přihlášení, databáze, fotky, náhledy odkazů |
| Mapa | MapLibre GL nebo Leaflet + OSM dlaždice | zdarma, bez Google API klíče |
| Grafy | Recharts (nebo podobná lehká knihovna) | statistiky |
| Hosting | **GitHub Pages** + GitHub Actions | zdarma, každý push na `main` = nová verze |
| Databáze v kódu | Supabase CLI – migrace v `supabase/migrations` | struktura databáze je verzovaná v GitHubu |

### Jak spolu GitHub a Supabase fungují

```
  iPhone (PWA na ploše)
        │  načte appku
        ▼
  GitHub Pages  ◄── GitHub Actions: build + deploy při každém pushi na main
        │  čte/zapisuje data (Supabase JS, přihlášený uživatel)
        ▼
  Supabase: Auth · Postgres (RLS) · Storage (fotky) · Edge Functions
        ▲
        └── GitHub Actions: `supabase db push` – aplikuje nové migrace
```

- **Repozitář:** `src/` (appka), `supabase/migrations/` (SQL struktura), `supabase/functions/`
  (náhledy odkazů, kalendář narozenin .ics), `.github/workflows/` (deploy)
- **Tajné hodnoty:** URL a veřejný (anon) klíč Supabase jdou do GitHub *Variables* – anon klíč je
  veřejný záměrně, data chrání RLS. Přístupový token Supabase CLI jde do GitHub *Secrets*.
- **GitHub Pages a routování:** appka poběží na `michaelbedna13.github.io/osobni-aplikace/`
  (nebo na vlastní doméně). Kvůli statickému hostingu se použije buď hash routing (`/#/piva`),
  nebo trik s `404.html`. Vlastní doména to zjednoduší.

### Přihlášení a bezpečnost
- Supabase Auth – e-mail + heslo nebo magic link; **registrace vypnutá** (účet jen pro tebe)
- Každá tabulka má `user_id` a **Row Level Security** → data vidí jen přihlášený vlastník
- Dlouhé přihlášení (session se obnovuje), ať se nemusíš pořád přihlašovat

### Datový model (náčrt)

Všechny tabulky mají `id`, `user_id`, `created_at`, `updated_at`.

```
quotes            text, author, context, said_at, is_favorite
tags / *_tags     společné štítky (vazební tabulky na jednotlivé moduly)

exercises         name, category, measure_type
workout_templates name, exercises (pořadí, plán sérií)
workouts          started_at, ended_at, template_id, note
workout_sets      workout_id, exercise_id, reps, weight_kg, duration_s, distance_m

meditations       started_at, duration_s, type, mood_before, mood_after, note

links             url, title, description, image_url, category, status, is_favorite

beers             drunk_at, name, brewery, style, volume_ml, price, rating, place_id, lat, lng

subscriptions     name, price, currency, period, next_renewal, category
savings_goals     name, target_amount, deadline
savings_entries   goal_id, amount, date
expenses          amount, category, date, note        (volitelné)

media_items       kind (movie/series/book), external_id, title, cover_url, status,
                  finished_at, rating, note, recommended_by

places            name, lat, lng, category, status, note, url, visited_at, rating
place_lists       name, date_from, date_to, note     (plány / výlety)
place_list_items  list_id, place_id, order

people            name, birthday (den+měsíc), birth_year (volitelně), group, note, photo_url
gift_ideas        person_id, title, url, price, note, status (idea/bought/given),
                  occasion, given_year

journal_entries   date (unikátní), text, mood (1–5), gratitude (1–3 položky), photo_url

wishlist_items    title, url, image_url, price, priority, status, savings_goal_id

goals             module, metric, period, target, direction (min/max), active
```

### Omezení PWA, se kterými počítat
- **iPhone (tvůj případ):**
  - instalace: Safari → Sdílet → „Přidat na plochu“ (appka pak běží na celou obrazovku)
  - **sdílení odkazu z jiné aplikace** (YouTube, Instagram, Safari): iOS neumí poslat odkaz
    přímo do webové appky → připravím **Zkratku** „Uložit do appky“, která se objeví v menu
    Sdílet a odkaz uloží
  - **připomínky narozenin:** přes odběr kalendáře (.ics) – nativní a spolehlivé
  - push notifikace u nainstalované PWA fungují (iOS 16.4+), ale nejsou potřeba pro MVP
  - Safari může smazat lokální cache u dlouho nepoužívané appky → data jsou ale v Supabase,
    takže se nic neztratí
  - respektovat „bezpečné zóny“ (výřez, Dynamic Island, spodní lišta)
- **Android:** vše funguje lépe (instalace, sdílení do appky, notifikace)
- Offline: čtení z cache a frontování zápisů je možné, ale do MVP stačí „funguje online,
  offline se aspoň zobrazí poslední data“

---

## 7. Plán (fáze)

**Fáze 0 – Základ** ✅ *hotovo, zbývá nastavení účtů (viz [NASTAVENI.md](NASTAVENI.md))*
Projekt, Supabase, přihlášení, PWA (ikona, splash), design tokeny, navigace, obrazovka Dnes (prázdná kostra).

Včetně GitHub Actions (deploy na GitHub Pages, migrace do Supabase).

**Fáze 1 – Rychlé výhry** (jednoduché moduly, hned použitelné)
Hláškomat · Piva · Odkazy (+ Zkratka pro iPhone) · Lidé, narozeniny a dárky (+ kalendář .ics)

**Fáze 2 – Tracking a cíle**
Systém cílů a streaků · Deník · Meditace (časovač) · Trénink

**Fáze 3 – Sbírky a mapa**
Mapa míst + plány · Filmy/seriály/knihy (TMDB, Open Library) · Wishlist

**Fáze 4 – Rozšíření**
Finance (předplatné → spořicí cíle → CSV import) · Import existujících dat · nápady z kapitoly 3

---

## 8. Otevřené otázky

1. ~~iPhone, nebo Android?~~ → **iPhone**
2. ~~Kde bude kód?~~ → **GitHub + Supabase**
3. **Jaká data už máš a kde?** (tabulka, poznámky, jiná appka, kontakty s narozeninami) → připravím import.
4. **Máš už Supabase projekt**, nebo založit nový? (na free tarifu se projekt po týdnu nečinnosti uspí – u denně používané appky to nevadí)
5. **Vlastní doména?** – jinak `michaelbedna13.github.io/osobni-aplikace`
6. **Název appky** – zobrazí se pod ikonou na ploše.

---

## 9. Design

Zvolený směr: **clean minimalism + neo brutalism + Bauhaus** → rozpracováno v
[DESIGN.md](DESIGN.md) – pixel art (od v2): každý modul je „level“ v plné barvě s pixelovou postavičkou.
