# Rovik Studio

A high-end creator editing workspace for YouTubers, TikTokers, streamers, and animators. This first version is a polished front-end prototype with video editing, image editing, AI production, timeline, media library, inspector, and export surfaces.

## Run locally

```bash
npm install
npm run dev
```

## Environment variables

Use `.env.local` for real keys. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and the optional legacy anon key are exposed to browser code. Keep `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Security note

Do not commit Supabase secret keys or service-role keys. Use server-side environment variables only, and rotate any secrets that have been shared in chat or committed anywhere.
