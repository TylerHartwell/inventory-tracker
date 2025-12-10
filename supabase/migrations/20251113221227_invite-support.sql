-- ============================================
-- 1. Create list_invites table
-- ============================================
CREATE TABLE IF NOT EXISTS public.list_invites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text NOT NULL CHECK (role = ANY (ARRAY['editor','viewer'])),
    status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','accepted','declined'])),
    accepted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (list_id, email)
);

CREATE INDEX IF NOT EXISTS idx_list_invites_list_id
  ON public.list_invites(list_id);

-- Enable RLS
ALTER TABLE public.list_invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. RLS Policies for list_invites
-- ============================================

-- Owners can view invites
CREATE POLICY "Owners can view invites"
ON public.list_invites FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.list_users
    WHERE list_id = list_invites.list_id
      AND user_id = auth.uid()
      AND role = 'owner'
  )
);

-- Allow users to SELECT their invites
CREATE POLICY "Users can select their own list invites"
ON public.list_invites
FOR SELECT TO authenticated
USING (
    email = auth.email()
);

-- Users can update only the status of their own invite
CREATE POLICY "Users can update their own list invite status safely"
ON public.list_invites
FOR UPDATE TO authenticated
USING (
    email = auth.email()  -- can only access their own invite
)
WITH CHECK (
    email = auth.email()  -- ensure they are only updating their own
    AND status IN ('accepted', 'declined')  -- only allow valid statuses
    AND list_id = list_invites.list_id  -- cannot change the list
    AND role = list_invites.role      -- cannot change the role
    AND email = list_invites.email    -- cannot change the email
);

-- Owners can create invites
CREATE POLICY "Owners can create invites"
ON public.list_invites FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.list_users
    WHERE list_id = list_invites.list_id
      AND user_id = auth.uid()
      AND role = 'owner'
  )
);

-- Owners can update invites (including changing invite role)
CREATE POLICY "Owners can update invites"
ON public.list_invites FOR UPDATE TO authenticated
USING (
  -- Must be an owner of the list the invite belongs to
  EXISTS (
    SELECT 1
    FROM public.list_users
    WHERE list_id = list_invites.list_id
      AND user_id = auth.uid()
      AND role = 'owner'
  )
)
WITH CHECK (
  -- Updated row must still belong to a list where the user is owner
  EXISTS (
    SELECT 1
    FROM public.list_users
    WHERE list_id = list_invites.list_id
      AND user_id = auth.uid()
      AND role = 'owner'
  )
);

-- Owners can delete invites
CREATE POLICY "Owners can delete invites"
ON public.list_invites FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.list_users
    WHERE list_id = list_invites.list_id
      AND user_id = auth.uid()
      AND role = 'owner'
  )
);


-- ============================================
-- 3. Functions
-- ============================================
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
      AND lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invite not found or already accepted/declined';
    END IF;

    -- Add to list_users
    INSERT INTO public.list_users(list_id, user_id, role, cached_display_name)
    VALUES (invite_record.list_id, auth.uid(), invite_record.role, (SELECT display_name FROM auth.users WHERE id = auth.uid()))
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

END;
$$;


-- ============================================
-- 4. Views
-- ============================================


CREATE OR REPLACE VIEW public.list_members
WITH (security_invoker = true)
AS
SELECT
  u.list_id,
  u.user_id,
  u.cached_display_name AS display_name,
  u.role,
  FALSE AS pending,
  NULL::text AS email
FROM public.list_users u

UNION ALL

SELECT
  i.list_id,
  NULL::uuid AS user_id,
  NULL AS display_name,
  i.role,
  TRUE AS pending,
  i.email
FROM public.list_invites i
WHERE i.status = 'pending';
