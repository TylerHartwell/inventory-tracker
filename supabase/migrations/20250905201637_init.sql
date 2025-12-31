-- ============================================
-- TABLES
-- ============================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text unique,
  constraint username_length check (char_length(username) >= 3)
);

-- Lists table
CREATE TABLE IF NOT EXISTS public.lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lists_owner_id
  ON public.lists(owner_id);

-- List Users table
CREATE TABLE IF NOT EXISTS public.list_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner','editor','viewer'])),
  UNIQUE (list_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_list_users_user_id
  ON public.list_users(user_id);

CREATE INDEX IF NOT EXISTS idx_list_users_list_id
  ON public.list_users(list_id);

-- Items table
CREATE TABLE IF NOT EXISTS public.items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id uuid REFERENCES public.lists(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  extra_details text,
  image_url text,
  expiration_date date,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE items REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_items_user_id
  ON public.items(user_id);

CREATE INDEX IF NOT EXISTS idx_items_list_id
  ON public.items(list_id);

-- List Invites table
CREATE TABLE IF NOT EXISTS public.list_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['editor','viewer'])),
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','accepted','declined'])),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_list_invites_list_id
  ON public.list_invites(list_id);

CREATE UNIQUE INDEX list_invites_unique_pending_ci
  ON public.list_invites (list_id, lower(email))
  WHERE status = 'pending';

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_invites ENABLE ROW LEVEL SECURITY;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_invites;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER 
  SET search_path = ''
  AS $$
  BEGIN
    INSERT INTO public.profiles (id)
    VALUES (new.id);
    RETURN new;
  END;
  $$;

  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.tf_add_list_creator_as_owner()
  RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
  BEGIN
    INSERT INTO public.list_users(list_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner');
    RETURN NEW;
  END;
  $$;

CREATE TRIGGER tr_add_list_creator_as_owner
  AFTER INSERT ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION public.tf_add_list_creator_as_owner();

CREATE OR REPLACE FUNCTION public.tf_prevent_ownerless_list()
  RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.lists WHERE id = OLD.list_id) THEN
      RETURN OLD;
    END IF;
    IF OLD.role = 'owner' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.list_users
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

CREATE TRIGGER tr_prevent_ownerless_list
  BEFORE DELETE ON public.list_users
  FOR EACH ROW
  EXECUTE FUNCTION public.tf_prevent_ownerless_list();

CREATE OR REPLACE FUNCTION public.fn_user_is_owner_of_list(_list_id uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = ''
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.list_users
      WHERE list_id = _list_id
        AND user_id = auth.uid()
        AND role = 'owner'
    );
  $$;

CREATE OR REPLACE FUNCTION public.fn_list_has_users(list_id uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.list_users
      WHERE list_users.list_id = fn_list_has_users.list_id
    );
  $$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Items
CREATE POLICY "Users can create items" 
  ON public.items 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) 
    AND
    (list_id IS NULL 
      OR 
      EXISTS (
        SELECT 1 FROM public.list_users
        WHERE list_users.list_id = items.list_id
          AND list_users.user_id = (SELECT auth.uid())
          AND list_users.role IN ('owner','editor')
      )
    )
  );

CREATE POLICY "Users can view items" 
  ON public.items 
  FOR SELECT 
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM public.list_users
      WHERE list_users.list_id = items.list_id
        AND list_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update items" 
  ON public.items 
  FOR UPDATE 
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM public.list_users
      WHERE list_users.list_id = items.list_id
        AND list_users.user_id = (SELECT auth.uid())
        AND list_users.role IN ('owner','editor')
    )
  );

CREATE POLICY "Users can delete items" 
  ON public.items 
  FOR DELETE 
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM public.list_users
      WHERE list_users.list_id = items.list_id
        AND list_users.user_id = (SELECT auth.uid())
        AND list_users.role IN ('owner','editor')
    )
  );

-- Lists
CREATE POLICY "Users can create lists" 
  ON public.lists 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can view lists" 
  ON public.lists 
  FOR SELECT 
  TO authenticated
  USING ( 
    owner_id = (SELECT auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM public.list_users
      WHERE list_users.list_id = lists.id
        AND list_users.user_id = (SELECT auth.uid())
    )   
    OR 
    EXISTS (
      SELECT 1 FROM public.list_invites
      WHERE list_invites.list_id = lists.id
        AND list_invites.email = (SELECT auth.email())
        AND list_invites.status = 'pending'
    )
  );

CREATE POLICY "Owners can update lists" 
  ON public.lists 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.list_users
      WHERE list_users.list_id = lists.id
        AND list_users.user_id = (SELECT auth.uid())
        AND list_users.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete lists" 
  ON public.lists 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.list_users
      WHERE list_users.list_id = lists.id
        AND list_users.user_id = (SELECT auth.uid())
        AND list_users.role = 'owner'
    )
  );

-- List Users
CREATE POLICY "Owners can add users" 
  ON public.list_users 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    public.fn_user_is_owner_of_list(list_users.list_id)
    OR
    (
      NOT public.fn_list_has_users(list_users.list_id)
      AND user_id = (select auth.uid())
      AND role = 'owner'
    )
  );

CREATE POLICY "Owners or self can remove membership" 
  ON public.list_users 
  FOR DELETE 
  TO authenticated
  USING (
    (user_id = (select auth.uid()) AND role <> 'owner')
    OR (
      public.fn_user_is_owner_of_list(list_users.list_id)
      AND role <> 'owner'
    )
  );

CREATE POLICY "Owners can update roles" 
  ON public.list_users 
  FOR UPDATE 
  TO authenticated
  USING (
    public.fn_user_is_owner_of_list(list_users.list_id)
  )
  WITH CHECK (
    role <> 'owner'
  );

CREATE POLICY "Users and owners can view list memberships"
  ON public.list_users
  FOR SELECT 
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR 
    public.fn_user_is_owner_of_list(list_users.list_id)
  );
