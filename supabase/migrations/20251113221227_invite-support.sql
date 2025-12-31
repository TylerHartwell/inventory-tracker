-- ============================================
-- 1. Functions
-- ============================================
CREATE OR REPLACE FUNCTION public.fn_list_has_member_with_email(
  _list_id uuid,
  _email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.list_users lu
    JOIN auth.users u ON u.id = lu.user_id
    WHERE lu.list_id = _list_id
      AND lower(u.email) = lower(_email)
  );
$$;

CREATE OR REPLACE FUNCTION public.accept_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    invite_record public.list_invites%ROWTYPE;
BEGIN
    SELECT * INTO invite_record
    FROM public.list_invites
    WHERE id = p_invite_id
      AND status = 'pending'
      AND lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invite not found or already accepted/declined';
    END IF;

    -- Add to list_users
    INSERT INTO public.list_users(list_id, user_id, role)
    VALUES (
      invite_record.list_id, 
      auth.uid(), 
      invite_record.role
    )
    ON CONFLICT (list_id, user_id) DO NOTHING;

    -- Update invite as accepted
    UPDATE public.list_invites
    SET status = 'accepted',
        accepted_at = now()
    WHERE id = p_invite_id;

END;
$$;


CREATE OR REPLACE FUNCTION public.decline_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    UPDATE public.list_invites
    SET status = 'declined'
    WHERE id = p_invite_id
      AND status = 'pending'
      AND lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()));

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invite not found or already handled';
    END IF;

END;
$$;


REVOKE ALL ON FUNCTION public.accept_invite(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decline_invite(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.accept_invite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_invite(uuid) TO authenticated;


-- ============================================
-- 2. RLS Policies for list_invites
-- ============================================

-- Owners or recipients can view invites
CREATE POLICY "Owners or recipients can view invites"
ON public.list_invites FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.list_users
    WHERE list_id = list_invites.list_id
      AND user_id = (select auth.uid())
      AND role = 'owner'
  )
  OR  
  email = (select auth.email())
);

-- Owners can create invites
CREATE POLICY "Owners can create invites"
ON public.list_invites FOR INSERT TO authenticated
WITH CHECK (
    -- Cannot invite yourself
  lower(email) <> lower((select auth.email()))
    -- Must be an owner of the list
  AND EXISTS (
    SELECT 1 FROM public.list_users
    WHERE list_id = list_invites.list_id
      AND user_id = (select auth.uid())
      AND role = 'owner'
  )
  -- Cannot invite someone already on the list
  AND NOT public.fn_list_has_member_with_email(
    list_invites.list_id,
    list_invites.email
  )
);

-- Invites update (invitee status OR owner role)
CREATE POLICY "Invites update (invitee status OR owner role)"
ON public.list_invites
FOR UPDATE
TO authenticated
USING (
  email = (select auth.email())
  OR
  EXISTS (
    SELECT 1
    FROM public.list_users
    WHERE list_id = list_invites.list_id
      AND user_id = (select auth.uid())
      AND role = 'owner'
  )
)
WITH CHECK (
  (
    email = (select auth.email())
    AND status IN ('accepted', 'declined')
    AND list_id = list_invites.list_id
    AND email = list_invites.email
    AND role = list_invites.role
  )
  OR
  (
    EXISTS (
      SELECT 1
      FROM public.list_users
      WHERE list_id = list_invites.list_id
        AND user_id = (select auth.uid())
        AND role = 'owner'
    )
    AND email = list_invites.email
    AND list_id = list_invites.list_id
    AND status = list_invites.status
  )
);

-- Owners can delete invites
CREATE POLICY "Owners can delete invites"
ON public.list_invites FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.list_users
    WHERE list_id = list_invites.list_id
      AND user_id = (select auth.uid())
      AND role = 'owner'
  )
);


-- ============================================
-- 3. Views
-- ============================================


CREATE OR REPLACE VIEW public.list_members
WITH (security_invoker = true)
AS
SELECT
  u.list_id,
  u.user_id,
  u.role,
  FALSE AS pending,
  NULL::text AS email
FROM public.list_users u

UNION ALL

SELECT
  i.list_id,
  NULL::uuid AS user_id,
  i.role,
  TRUE AS pending,
  i.email
FROM public.list_invites i
WHERE i.status = 'pending';
