# Pool-Casinot

This project is a neon-themed frontend for a casino UI and is now integrated with Supabase for auth, database, and persistent game data. The app is intended to be deployed as a static site (for example on Vercel) and talk directly to Supabase — no custom backend server is required.

Quick setup (Vercel):

1. Create a Supabase project and add these tables (simplified schema):
	- `users` (id uuid PRIMARY KEY, username text, balance numeric DEFAULT 1000)
	- `game_history` (id, user_id, game, result_number, bet_type, bet_amount, win, created_at)
	- `global_stats` (id, total_pool, biggest_win, biggest_bet)

2. Enable Row Level Security (RLS) and create policies so users can only modify their own `users` row and insert into `game_history` with their own `user_id`.

3. In your Vercel project settings set the following environment variables:
	- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon/public key

4. Deploy the repository as a static site. The client reads the env values at runtime and initializes the Supabase client in `/lib/supabase.js`.

Local notes:
- The UI files are in the project root (`index.html`, `style/`, `js/`).
- Auth flows use the Supabase client directly (no Express server).
- If you need server-side atomic operations (recommended for production), consider adding Supabase Edge Functions or Postgres RPC for the roulette spin logic.

Security note: The current frontend performs the spin logic and then writes updates to Supabase. For trust and atomicity in production, implement spins server-side (Edge Function or Postgres function) so randomness and balance updates are authoritative.
