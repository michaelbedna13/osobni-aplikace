---
version: 1
slug: "src-styles-app-css"
primary_target: "src/styles/app.css"
related_targets: ["src/screens/Today.tsx","src/modules/piva/PivaScreen.tsx","src/modules/hlaskomat/HlaskomatScreen.tsx","src/modules/meditace/MeditaceScreen.tsx"]
---

# Surface brief: celá appka (Dnes, Moduly, Piva, Hláškomat, Meditace, Profil, Přihlášení)

Scope: redesign všech obrazovek osobní iPhone PWA. Mode: Operate.
Audience: jeden uživatel, česky, iPhone; rychlé zápisy venku jednou rukou, statistiky doma, ranní/večerní rutina, ukazování kamarádům.
Task: zápis jedním ťuknutím (+1 pivo, start meditace, nová hláška) a čitelné statistiky.
Constraints: zachovat černé obrysy a tvrdé stíny; data, funkce a texty modulů beze změny; čeština s diakritikou; iOS safe areas; reduced motion.
Chosen direction: pixel art (pinned uživatelem po dvou hodech; seed b275f94a, re-roll 1 degraded, bez challengerů).
Memorable moment: +1 pivo – pixelový půllitr poskočí, vyletí +1 a pixelové konfety.

## Direction contract

THESIS: Appka je kapesní 8bitová hra o vlastním životě: každý modul je jiný „level“ s vlastní barvou a pixelovou postavičkou, zápis je herní akce s odměnou. Odmítá šablonu „bílé karty s ikonou a nadpisem“ i šedý podklad.

OWN-WORLD: Obrazovky modulů celé v plné barvě modulu (jantar, citron, šalvěj…), Dnes v tmavě modré „noci“ s pixelovými hvězdami. Hranaté bloky bez zaoblení, 3px černý obrys, tvrdý stín 4–6 px, tlačítka jako 3D herní kostky. Pixelové sprity 16×16 kreslené v kódu. Písmo Pixelify Sans na nadpisy, čísla a tlačítka; Rubik na delší text.

STORY: Uživatel otevře appku, na první pohled pozná modul podle barvy a postavičky, jedním ťuknutím zapíše a dostane odměnu; statistiky čte jako herní skóre: bloky, které jde spočítat okem, a rekordy jako trofeje.

FIRST VIEWPORT: Piva: celá obrazovka jantarová, nahoře vlevo zpět a název, uprostřed velký pixelový půllitr s obličejem (~40 % šířky), pod ním obří pixelové číslo „dnes“, pod ním přes celou šířku 3D tlačítko „+1 PIVO“ (72 px). Dnes: tmavě modrá, pozdrav a datum pixelovým písmem, pás karet modulů v jejich barvách se sprity a rychlou akcí.

FORM: pixel art / 8bit hra, pinned uživatelem (mimo seznam), seed key b275f94a.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
