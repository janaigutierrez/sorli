-- ════════════════════════════════════════════════════════════════
-- Sorli · Migració 6: índexs per a claus foranes
-- Recomanació de l'advisor de rendiment de Supabase: accelera els
-- esborrats en cascada (p. ex. eliminar un post amb notificacions).
-- ════════════════════════════════════════════════════════════════
create index if not exists invitations_created_by_idx  on public.invitations (created_by);
create index if not exists invitations_used_by_idx     on public.invitations (used_by);
create index if not exists notifications_actor_idx     on public.notifications (actor_id);
create index if not exists notifications_post_idx      on public.notifications (post_id);
create index if not exists notifications_comment_idx   on public.notifications (comment_id);
create index if not exists profiles_invitation_idx     on public.profiles (invitation_id);
