// Co všechno se skrývá za číslem 13 – připravené významy (vlastní si uživatel přidá k nim).

export interface Meaning { category: string; title: string; body: string }

export const MEANING_CATEGORIES = ["Matematika a příroda", "Historie", "Víra a tradice", "Kultura a sport", "Ezo a symbolika"] as const;

export const MEANINGS: Meaning[] = [
  // Matematika a příroda
  { category: "Matematika a příroda", title: "Prvočíslo", body: "13 je dělitelné jen jedničkou a samo sebou – nedá se rozložit. Šesté prvočíslo." },
  { category: "Matematika a příroda", title: "Fibonacciho číslo", body: "0, 1, 1, 2, 3, 5, 8, 13… Řada, ve které roste ulita, šiška i slunečnice. Zlatý řez v přírodě." },
  { category: "Matematika a příroda", title: "13 Archimedových těles", body: "Existuje přesně 13 polopravidelných mnohostěnů, které popsal Archimédés." },
  { category: "Matematika a příroda", title: "13 měsíců", body: "Rok má zhruba 13 lunárních cyklů po 28 dnech. Některé kalendáře (třeba „13 měsíců“) s tím počítají místo 12." },
  { category: "Matematika a příroda", title: "13 karet v barvě", body: "V každé barvě klasických karet je 13 karet: eso až král. Čtyři barvy × 13 = 52 karet = 52 týdnů v roce." },
  // Historie
  { category: "Historie", title: "Pátek 13. a templáři", body: "V pátek 13. října 1307 dal francouzský král Filip IV. zatknout rytíře templáře. Často se uvádí jako počátek pověry – i když „smolný pátek 13.“ se jako ustálená pověra objevuje až v 19. století." },
  { category: "Historie", title: "13 kolonií a USA", body: "Spojené státy vznikly ze 13 kolonií: 13 pruhů na vlajce, na Velké pečeti 13 hvězd, 13 šípů a 13 olivových listů." },
  { category: "Historie", title: "Apollo 13", body: "Mise z roku 1970, které na cestě k Měsíci vybuchla nádrž s kyslíkem. Posádka se díky improvizaci vrátila živá – „úspěšný neúspěch“." },
  { category: "Historie", title: "Mayský kalendář", body: "Dlouhý počet Mayů měřil čas v cyklech; 21. 12. 2012 skončil 13. baktun (144 000 dní). Posvátný kalendář tzolkin má 260 dní = 13 × 20. Pro Maye znamenala 13 proměnu a obnovu." },
  // Víra a tradice
  { category: "Víra a tradice", title: "Bar micva", body: "V judaismu se chlapec ve 13 letech stává dospělým před zákonem – „synem přikázání“." },
  { category: "Víra a tradice", title: "13 vlastností Božího milosrdenství", body: "Židovská tradice zná 13 vlastností milosrdenství (Exodus 34) a Maimonidových 13 článků víry." },
  { category: "Víra a tradice", title: "Poslední večeře", body: "U stolu sedělo 13 lidí – Ježíš a 12 apoštolů; třináctý host Jidáš ho zradil. Odtud křesťanská nedůvěra k „13 u stolu“." },
  { category: "Víra a tradice", title: "Loki, třináctý host", body: "V severské mytologii přišel na hostinu bohů nezvaný Loki jako 13. a způsobil smrt boha Baldra." },
  { category: "Víra a tradice", title: "Svatý Antonín", body: "V Itálii je 13 šťastné číslo, spojené se svatým Antonínem z Padovy (svátek 13. června), patronem ztracených věcí." },
  // Kultura a sport
  { category: "Kultura a sport", title: "„Fare tredici“", body: "Italsky „udělat třináctku“ = vyhrát. Pochází ze sázek Totocalcio, kde se tipovalo 13 zápasů." },
  { category: "Kultura a sport", title: "Taylor Swift", body: "Její šťastné číslo: narodila se 13. prosince a na koncertech si psala 13 na ruku." },
  { category: "Kultura a sport", title: "Legendy s 13 na dresu", body: "Wilt Chamberlain (100 bodů v jednom zápase NBA), Steve Nash (2× MVP), Dan Marino (NFL), Pavel Dacjuk (NHL), Alex Morgan (fotbal)." },
  { category: "Kultura a sport", title: "Ragby league", body: "Tým ragby league má na hřišti 13 hráčů." },
  { category: "Kultura a sport", title: "Bez 13. patra", body: "Mnoho hotelů a mrakodrapů 13. patro ani pokoj 13 nemá. Strach z čísla 13 se jmenuje triskaidekafobie, z pátku 13. paraskevidekatriafobie." },
  { category: "Kultura a sport", title: "Un, trois", body: "Untrois = francouzsky „jedna, tři“. 1 a 3 vedle sebe dávají 13." },
  // Ezo a symbolika
  { category: "Ezo a symbolika", title: "Tarot: XIII Smrt", body: "Třináctá karta velké arkány. Neznamená fyzickou smrt, ale konec jedné etapy, proměnu a znovuzrození – odejít od toho, co už neslouží." },
  { category: "Ezo a symbolika", title: "Numerologie: 1 + 3 = 4", body: "1 je vůle a začátek, 3 tvořivost a vyjádření. Dohromady 4 – pevný základ. 13 je „karmické číslo“ práce: co postavíš poctivě, vydrží." },
  { category: "Ezo a symbolika", title: "Andělské číslo 13", body: "Podle „andělských čísel“ znamená opakující se 13 změnu, která přichází k dobru, a podporu na cestě – drž se svého směru." },
  { category: "Ezo a symbolika", title: "Ženské a měsíční číslo", body: "13 úplňků v některých letech a 13 cyklů v roce spojují 13 s Měsícem, ženskou energií a intuicí. Proto ho církev ve středověku démonizovala." },
  { category: "Ezo a symbolika", title: "12 + 1", body: "12 je úplnost (měsíce, znamení zvěrokruhu, apoštolové). 13 je to, co přesahuje řád – střed kruhu, ten navíc, který mění pravidla." },
  { category: "Ezo a symbolika", title: "Šťastná v Číně", body: "V kantonštině zní 13 podobně jako „určitě žít“ – proto ho někteří Číňané berou jako šťastné." },
];
