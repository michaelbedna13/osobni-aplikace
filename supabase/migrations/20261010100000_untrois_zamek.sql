-- Zámek modulu Untrois: otisk hesla (PBKDF2 se solí, „sůl:otisk“). Heslo si uživatel nastaví v appce.
-- Zapomenuté heslo: update user_settings set untrois_lock = null;  (při dalším otevření se nastaví nové)
alter table user_settings add column if not exists untrois_lock text;
