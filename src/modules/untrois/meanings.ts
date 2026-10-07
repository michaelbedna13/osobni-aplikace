// Co všechno se skrývá za číslem 13 – připravené významy (vlastní si uživatel přidá k nim).
// fakt = dá se ověřit; výklad = symbolika, pověst nebo tradiční vysvětlení (jako obraz, ne jako tvrzení).

export interface Meaning { category: string; title: string; body: string; kind: "fakt" | "vyklad" }

export const MEANING_CATEGORIES = ["Matematika a příroda", "Historie", "Víra a tradice", "Kultura a sport", "Symbolika"] as const;

export const MEANINGS: Meaning[] = [
  // Matematika a příroda
  { category: "Matematika a příroda", kind: "fakt", title: "Prvočíslo", body: "13 je dělitelné jen jedničkou a samo sebou – nedá se rozložit. Šesté prvočíslo." },
  { category: "Matematika a příroda", kind: "fakt", title: "Fibonacciho číslo", body: "0, 1, 1, 2, 3, 5, 8, 13… Řada, podle které rostou spirály šišek a slunečnic." },
  { category: "Matematika a příroda", kind: "fakt", title: "13 Archimedových těles", body: "Existuje přesně 13 polopravidelných mnohostěnů, které popsal Archimédés." },
  { category: "Matematika a příroda", kind: "fakt", title: "13 oběhů Měsíce", body: "Vůči hvězdám oběhne Měsíc Zemi zhruba 13,4× za rok (siderický měsíc má 27,3 dne). Úplňků bývá 12, třináct jen asi každý třetí rok." },
  { category: "Matematika a příroda", kind: "fakt", title: "13 karet v barvě", body: "V každé barvě klasických karet je 13 karet: eso až král. Čtyři barvy × 13 = 52 karet, stejně jako týdnů v roce." },
  // Historie
  { category: "Historie", kind: "fakt", title: "Pátek 13. a templáři", body: "V pátek 13. října 1307 dal francouzský král Filip IV. zatknout rytíře templáře. Často se uvádí jako počátek pověry, ale „smolný pátek 13.“ se jako ustálená pověra objevuje až koncem 19. století." },
  { category: "Historie", kind: "fakt", title: "13 kolonií a USA", body: "Spojené státy vznikly ze 13 kolonií: 13 pruhů na vlajce, na Velké pečeti 13 hvězd, 13 šípů a 13 olivových listů." },
  { category: "Historie", kind: "fakt", title: "Apollo 13", body: "Mise z roku 1970, které na cestě k Měsíci vybuchla nádrž s kyslíkem. Posádka se díky improvizaci vrátila živá – „úspěšný neúspěch“." },
  { category: "Historie", kind: "fakt", title: "Mayský kalendář", body: "Posvátný kalendář tzolkʼin má 260 dní = 13 čísel × 20 jmen dnů a sloužil i k věštění. Mayská kosmologie zná 13 nebeských vrstev. Dlouhý počet uzavřel 21. 12. 2012 13. baktun." },
  { category: "Historie", kind: "fakt", title: "Mayská číslice 13", body: "Mayové psali čísla tečkami (1) a čárkami (5). Třináctka jsou dvě čárky a tři tečky." },
  // Víra a tradice
  { category: "Víra a tradice", kind: "fakt", title: "Bar micva", body: "V judaismu se chlapec ve 13 letech stává dospělým před zákonem – „synem přikázání“." },
  { category: "Víra a tradice", kind: "fakt", title: "13 vlastností Božího milosrdenství", body: "Židovská tradice zná 13 vlastností milosrdenství (Exodus 34) a Maimonidových 13 článků víry." },
  { category: "Víra a tradice", kind: "vyklad", title: "Poslední večeře", body: "U stolu sedělo 13 lidí – Ježíš a 12 apoštolů, mezi nimi Jidáš, který ho zradil. Tím se tradičně vysvětluje křesťanská nedůvěra k „13 u stolu“." },
  { category: "Víra a tradice", kind: "vyklad", title: "Loki, třináctý host", body: "Podle jednoho převyprávění severské pověsti přišel na hostinu bohů nezvaný Loki jako třináctý a způsobil smrt boha Baldra." },
  { category: "Víra a tradice", kind: "fakt", title: "Svatý Antonín", body: "V Itálii je 13 spíš šťastné číslo. Svátek svatého Antonína z Padovy, patrona ztracených věcí, připadá na 13. června." },
  // Kultura a sport
  { category: "Kultura a sport", kind: "fakt", title: "„Fare tredici“", body: "Italsky „udělat třináctku“ = vyhrát. Pochází ze sázek Totocalcio, kde se tipovalo 13 zápasů." },
  { category: "Kultura a sport", kind: "fakt", title: "Taylor Swift", body: "Její šťastné číslo: narodila se 13. prosince a na koncertech si psala 13 na ruku." },
  { category: "Kultura a sport", kind: "fakt", title: "Legendy s 13 na dresu", body: "Wilt Chamberlain (100 bodů v jednom zápase NBA), Steve Nash (2× MVP), Dan Marino (NFL), Pavel Dacjuk (NHL), Alex Morgan (fotbal)." },
  { category: "Kultura a sport", kind: "fakt", title: "Ragby league", body: "Tým ragby league má na hřišti 13 hráčů." },
  { category: "Kultura a sport", kind: "fakt", title: "Bez 13. patra", body: "Mnoho hotelů a mrakodrapů 13. patro ani pokoj 13 nemá. Strach z čísla 13 se jmenuje triskaidekafobie, z pátku 13. paraskevidekatriafobie." },
  { category: "Kultura a sport", kind: "fakt", title: "Un, trois", body: "Untrois = francouzsky „jedna, tři“. 1 a 3 vedle sebe dávají 13." },
  // Symbolika
  { category: "Symbolika", kind: "vyklad", title: "Tarot: XIII Smrt", body: "Třináctá karta velké arkány. Vykládá se jako konec jedné etapy a proměna, ne doslovná smrt – svléknout starou kůži, aby mohla narůst nová." },
  { category: "Symbolika", kind: "vyklad", title: "12 + 1", body: "12 je uzavřený celek: měsíce, znamení, hodiny na ciferníku. 13 je krok přes okraj kruhu, do místa, které ještě nemá tvar." },
  { category: "Symbolika", kind: "vyklad", title: "Měsíční číslo", body: "Měsíc oběhne Zemi zhruba třináctkrát za rok. Proto se 13 v moderní symbolice spojuje s Měsícem, cykly a návraty." },
  { category: "Symbolika", kind: "vyklad", title: "Šťastná v Číně", body: "Uvádí se, že v kantonštině zní 13 podobně jako „určitě žít“, a proto ho někteří berou jako šťastné." },
];
