# Copilot Instructions for Inventory Tracker

## Project Overview

**Inventory Tracker** is a collaborative inventory management application built with Next.js 15 + React 19 and Supabase for real-time, multi-user list management. Users can create shared lists, add items with images, assign categories/expiration dates, and collaborate through role-based access (owner/editor/viewer).

## Architecture & Data Flow

### Core Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Client**: Supabase JS SDK with auto-refreshing sessions

### Data Model

- **Users**: Profiles (username via `auth.users` references)
- **Lists**: Created by owners, shared via list_users (role-based) or list_invites
- **Items**: Belong to users and optionally to lists; include images (signed URLs via Supabase Storage)
- **Invitations**: Email-based with pending/accepted/declined status

Key insight: `list_id = null` represents a user's "Personal" list (handled via `nullListName` constant in ItemManager).

### Real-time Architecture

`useItemsRealtime` hook manages efficient subscriptions:

- Tracks `filteredListIds` and diffs changes (added/removed lists)
- Only fetches items for changed lists using `useFetchItemsForLists`
- Maintains `itemsMap` (client-side cache) to avoid re-fetching unchanged data
- Subscriptions cleaned up on unmount or list filter changes

Key pattern: Use `useDeepCompareRef` to compare filtered list ID arrays by value, not reference.

## Project-Specific Patterns

### Error Handling

- **Global pattern**: Utilities return `{ data: T | null, error: string | null }` objects (see `insertItem`, `uploadImage`)
- **React Error Boundary**: Wraps auth and main app; provides reload mechanism
- **Async errors**: Caught and transformed to user-friendly strings in utility functions

### Image Management

- **Storage path structure**: `lists/{listId}/{itemId}/*` or `users/{userId}/{itemId}/*`
- **Signed URLs**: 20-minute expiry via `useGenerateSignedUrl`; returns `null` if file missing
- **File validation**: Max 5MB, must be image MIME type; file names sanitized (non-word chars → `_`)
- **Upload pattern**: Generate path, sanitize filename, upload with `upsert: false` to prevent overwrites

### State Management

- **Session storage** persistence: `filteredListIds`, `selectedListId`, `followInputList`, `sortAsc` stored in sessionStorage in ItemManager
- **Supabase auth**: Auto-refreshed via SDK configuration; subscribe to `onAuthStateChange` for real-time sync

### Type Generation

Database types from Supabase CLI: `src/types/supabase.ts` generated via `supabase gen types typescript`. Update after schema migrations.

## Essential Developer Workflows

### Setup & Development

```bash
npm run dev                    # Start dev server (Turbopack enabled)
supabase start                 # Start local Supabase stack (required for full workflow)
supabase migration list        # Check pending migrations
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Anon key for client auth (public)
```

### Database Changes

After modifying `supabase/migrations/`:

```bash
supabase db push              # Apply pending migrations locally
supabase gen types typescript # Regenerate src/types/supabase.ts
```

### Testing Realtime Features

- Use browser DevTools to throttle network and observe subscription behavior
- Test list filtering by adding/removing lists while items are displayed
- Verify signed URL expiry by waiting 20 minutes before accessing images

## Key File Locations & Patterns

| Concern                | File                                              | Pattern                                                  |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| Auth flow              | `src/components/AuthForm.tsx`                     | Email/password with 8-char min; confirm-required signup  |
| Item CRUD              | `src/utils/{insertItem,updateItem,deleteItem}.ts` | Returns `{data, error}` tuple; validates before mutating |
| Real-time subscription | `src/hooks/useItemsRealtime.ts`                   | Efficient diffing; cancellation via AbortSignal          |
| List management        | `src/hooks/useUserLists.ts`                       | Fetches lists user has access to via `list_users`        |
| Image signing          | `src/hooks/useGenerateSignedUrl.ts`               | Handles missing files gracefully; trims/normalizes paths |
| Main app logic         | `src/components/ItemManager.tsx`                  | Orchestrates lists, filters, items, realtime; ~171 lines |
| Schema                 | `supabase/migrations/20250905201637_init.sql`     | RLS policies; check constraints on roles/statuses        |

## Critical Integration Points

1. **Supabase RLS**: All tables have row-level security policies. Verify policies allow authenticated reads/writes after schema changes.
2. **Realtime subscriptions** (`alterPublications`): `items`, `lists`, `list_users`, `list_invites` tables have realtime enabled.
3. **Storage images**: Must reference via signed URL due to private bucket; handles expiry + missing files gracefully.
4. **Invitations**: Email-based with unique constraint on (list_id, email) for pending status; enables resend/accept workflows.

## Code Style & Conventions

- **Functional components + hooks**: No class components or HOCs
- **TypeScript strict mode enabled**: Avoid `any`; export types alongside implementations
- **Error messages**: User-friendly strings; log technical details only in dev environment
- **Component colocation**: Hooks/types near usage sites; utilities isolated in `src/utils/`
- **Naming**: `use*` for hooks, `*Form`/`*List`/`*Card` for components, `*Realtime`/`*Fetcher` for complex hooks

## Common Pitfalls & Solutions

| Issue                             | Root Cause                                         | Solution                                                               |
| --------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| Stale item lists on filter change | Missing dependency in `useItemsRealtime` useEffect | Use `useDeepCompareRef` for list ID comparisons                        |
| 404 on image load                 | Signed URL expired or file missing                 | `useGenerateSignedUrl` returns `null`; handle gracefully               |
| Duplicate invitations             | No constraint on multiple pending invites          | Unique constraint `list_invites_unique_pending_ci` prevents duplicates |
| Missing RLS errors in dev         | Local Supabase RLS not enforced during testing     | Enable RLS; test with anon key to catch policy bugs early              |

## When Adding New Features

1. Define types in schema migrations; generate `src/types/supabase.ts`
2. Create utility function in `src/utils/` returning `{data, error}` tuple
3. Use hook in component or trigger via event handlers
4. Subscribe to realtime via Supabase JS if data should auto-update
5. Add error boundary + user-facing error message
