# Setup for the free feature update (v3)

1. Supabase > SQL editor: run `supabase/update_v3_free_features.sql` once (safe to run again). It adds faster sync, photo and backup buckets, tighter permissions, change history and the enquiry table.
2. Vercel > Settings > Environment Variables: add `CRON_SECRET` (any long random text). Keep the existing Supabase, Gemini and push variables.
3. Redeploy. The daily backup and keep-alive job (`vercel.json`) starts by itself.
4. Admission form link: your site address followed by `/?enquiry=1`.

Until step 1 is done the app still works: sync falls back to full reloads, photos stay small, and the new tables show empty.
