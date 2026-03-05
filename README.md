# Inventory Tracker

A Next.js inventory tracker for creating personal or shared item lists with role-based collaboration.

It combines authentication, item CRUD, list invites, and realtime sync so multiple users can manage collections together in one interface.

## Features

- Email/password authentication with Supabase Auth.
- Create, edit, and delete items with optional extra details.
- Upload, preview, replace, and remove item images (Supabase Storage).
- Personal list support plus shared lists.
- List invitations with accept/decline flow.
- Role-based permissions (`owner`, `editor`, `viewer`) for collaborative lists.
- Owner controls for member role updates and membership management.
- Filter items by one or more lists.
- Sort items by created date (newest/oldest).
- Realtime updates for items, invites, and membership changes.
- Session-persisted UI state (selected list, filters, sort order).

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Supabase:
  - Auth
  - Postgres
  - Realtime
  - Storage (images bucket)
- Radix UI primitives
- Lucide React icons

## Project Structure

```text
src/
	app/                    # App entry, layout, global styles
	components/
		header/               # Header, user settings, invite UI
		item-input/           # Item/list creation and list configuration UI
		sorted-item-results/  # Item cards, edit form, loading states
	hooks/                  # Reusable state and realtime data hooks
	utils/
		image/                # Image upload/delete helpers
		item/                 # Item data operations
		list/                 # List data operations
		list-invite/          # Invite CRUD utilities
		list-user/            # List membership/role utilities
		profile/              # Profile update utilities
	types/                  # Generated and shared TypeScript types
	supabase-client.ts      # Typed Supabase client setup

supabase/
	migrations/             # SQL schema and migration history
	config.toml             # Local Supabase configuration
```

## Getting Started

### Prerequisites

- Node.js 18.18+ (or newer LTS recommended)
- npm
- Supabase project (hosted or local CLI stack)

### Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

- `npm run dev`: Start the Next.js dev server with Turbopack.
- `npm run build`: Build for production.
- `npm run start`: Run the production build.
- `npm run lint`: Run ESLint.

## Supabase Notes

- The app expects an `images` storage bucket for item image uploads.
- Realtime subscriptions are used for:
  - `items` table changes
  - `list_users` table membership/permission changes
  - user invite updates
- Local Supabase project configuration is in `supabase/config.toml`.

## Core Flow

1. User signs in (or signs up) with email/password.
2. The app loads profile, list memberships, and pending invites.
3. User creates/selects a list and manages items (including optional images).
4. Items are filtered/sorted client-side and synced through Supabase Realtime.
5. Owners can invite collaborators and manage member roles (`editor`/`viewer`).
