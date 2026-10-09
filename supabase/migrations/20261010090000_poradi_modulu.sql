-- Pořadí modulů na obrazovce Dnes: nejdřív Meditace, Piva, Hláškomat, zbytek ve stávajícím pořadí.
-- Lze spustit opakovaně; moduly, které nebyly připnuté, se připnou.
update user_settings
set pinned_modules = array['meditace', 'piva', 'hlaskomat']
  || array(select m from unnest(pinned_modules) with ordinality as t(m, i)
           where m not in ('meditace', 'piva', 'hlaskomat') order by i);

alter table user_settings
  alter column pinned_modules set default array['meditace', 'piva', 'hlaskomat', 'vdecnost', 'lide'];
