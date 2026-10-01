# SquadUp.GG

A gaming social/LFG web app MVP focused on finding people to play with.

## Included in this first slice
- Dark gaming-focused UI
- Player discovery/search
- Game and game-mode filters
- LFG feed with join requests
- Saved squads UI
- Profile UI
- Supabase Auth-ready login
- Supabase/Postgres schema for profiles, games, modes, friends, squads, LFG posts/requests, saved squads
- Seed catalog of popular Steam games

## Run locally

```bash
npm install
cp .env.example .env.local
# put your Supabase URL + anon key in .env.local
npm run dev
```

Without Supabase keys the app runs in demo mode. Real authentication and persistence are enabled once the Supabase project is configured.

## Supabase setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Enable Email/Password auth.
4. Copy the project URL and anon key to `.env.local`.

## Steam integration
Steam's Web API exposes current-player counts by AppID through `ISteamUserStats/GetNumberOfCurrentPlayers`. The game catalog should be refreshed server-side and cached rather than calling Steam directly from every browser request. Steam's public Web API is documented at the Steamworks Web API documentation.

For a production "most played" ranking, use a scheduled backend job to maintain a normalized `games.player_count` value and sort featured games from that cache.
