-- 051_drop_admins_manage_applications.sql
-- "Admins manage applications" was made in the dashboard (it is in no migration) and
-- gave every admin_users row, chairs and judges included, full read/update/delete on
-- every application, overriding 036. The scoped policies stay:
--   SELECT  own row, or is_active_admin(), or chair of the assigned committee
--   UPDATE  is_academic_staff()
--   DELETE  is_active_admin()
--   INSERT  the two application-form policies

DROP POLICY IF EXISTS "Admins manage applications" ON public.applications;
