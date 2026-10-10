-- Upozornění: práva pro funkci untrois-push (service role).
-- Nové tabulky se v tomhle projektu automaticky nezpřístupňují nikomu, ani service roli, takže funkce bez těchto
-- grantů končila chybou 500 („permission denied“). Funkce jen čte a zapisuje deník a klíče; RLS service role obchází.
grant select, insert on public.push_vapid to service_role;
grant select, insert on public.notification_log to service_role;
grant select, delete on public.push_subscriptions to service_role;
grant select on public.user_settings to service_role;
grant select on public.people, public.gift_ideas to service_role;
grant select on public.expenses, public.subscriptions to service_role;
grant select on public.shopping_items, public.meditations, public.gratitude to service_role;
