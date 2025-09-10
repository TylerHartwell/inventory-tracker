-- ============================================
-- TABLES
-- ============================================

-- 1. Lists table
CREATE TABLE IF NOT EXISTS public.lists (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 2. List users table
CREATE TABLE IF NOT EXISTS public.list_users (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    list_id uuid REFERENCES public.lists(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role = ANY (ARRAY['owner','editor','viewer'])),
    UNIQUE (list_id, user_id)
);

-- 3. Items table
CREATE TABLE IF NOT EXISTS public.items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    list_id uuid REFERENCES public.lists(id) ON DELETE SET NULL,
    item_name text NOT NULL,
    extra_details text,
    image_url text,
    expiration_date date,
    category text,
    created_at timestamptz DEFAULT now()
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.items;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Automatically add owner when a new list is created
CREATE OR REPLACE FUNCTION public.tf_add_list_creator_as_owner()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO list_users(list_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

-- Prevent removing the last owner from a list
CREATE OR REPLACE FUNCTION public.tf_prevent_ownerless_list()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role = 'owner' THEN
    IF NOT EXISTS (
      SELECT 1 FROM list_users
      WHERE list_id = OLD.list_id
        AND user_id != OLD.user_id
        AND role = 'owner'
    ) THEN
      RAISE EXCEPTION 'Cannot remove the last owner from a list';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER tr_add_list_creator_as_owner
AFTER INSERT ON public.lists
FOR EACH ROW
EXECUTE FUNCTION public.tf_add_list_creator_as_owner();

CREATE TRIGGER tr_prevent_ownerless_list
BEFORE DELETE ON public.list_users
FOR EACH ROW
EXECUTE FUNCTION public.tf_prevent_ownerless_list();

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Items
CREATE POLICY "Users can create items" 
ON public.items FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  (list_id IS NULL OR EXISTS (
    SELECT 1 FROM public.list_users
    WHERE list_users.list_id = items.list_id
      AND list_users.user_id = auth.uid()
      AND list_users.role IN ('owner','editor')
  ))
);

CREATE POLICY "Users can view items" 
ON public.items FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.list_users
    WHERE list_users.list_id = items.list_id
      AND list_users.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update items" 
ON public.items FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.list_users
    WHERE list_users.list_id = items.list_id
      AND list_users.user_id = auth.uid()
      AND list_users.role IN ('owner','editor')
  )
);

CREATE POLICY "Users can delete items" 
ON public.items FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.list_users
    WHERE list_users.list_id = items.list_id
      AND list_users.user_id = auth.uid()
      AND list_users.role IN ('owner','editor')
  )
);

-- Lists
CREATE POLICY "Users can create lists" 
ON public.lists FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view lists" 
ON public.lists FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.list_users
  WHERE list_users.list_id = lists.id
    AND list_users.user_id = auth.uid()
));

CREATE POLICY "Owners can update lists" 
ON public.lists FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.list_users
  WHERE list_users.list_id = lists.id
    AND list_users.user_id = auth.uid()
    AND list_users.role = 'owner'
));

CREATE POLICY "Owners can delete lists" 
ON public.lists FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.list_users
  WHERE list_users.list_id = lists.id
    AND list_users.user_id = auth.uid()
    AND list_users.role = 'owner'
));

-- List Users
CREATE POLICY "Owners can add users" 
ON public.list_users FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.list_users lu
  WHERE lu.list_id = list_users.list_id
    AND lu.user_id = auth.uid()
    AND lu.role = 'owner'
));

CREATE POLICY "Owners or self can remove membership" 
ON public.list_users FOR DELETE TO authenticated
USING (
  (user_id = auth.uid() AND role <> 'owner') OR
  EXISTS (
    SELECT 1 FROM public.list_users lu
    WHERE lu.list_id = list_users.list_id
      AND lu.user_id = auth.uid()
      AND lu.role = 'owner'
      AND list_users.role <> 'owner'
  )
);

CREATE POLICY "Owners can update roles" 
ON public.list_users FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.list_users lu
  WHERE lu.list_id = list_users.list_id
    AND lu.user_id = auth.uid()
    AND lu.role = 'owner'
))
WITH CHECK (role <> 'owner');

CREATE POLICY "Users can view their own list memberships" 
ON public.list_users FOR SELECT TO authenticated
USING (user_id = auth.uid());
