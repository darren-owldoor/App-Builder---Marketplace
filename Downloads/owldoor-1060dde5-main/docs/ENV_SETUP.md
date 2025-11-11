# Environment Setup

## Frontend (`.env.local`)

Create `/Users/Darren/Downloads/owldoor-1060dde5-main/.env.local` with:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-or-public-key>
VITE_SUPABASE_PROJECT_ID=oouyhixnjwjnombgcyjl
VITE_GOOGLE_MAPS_API_KEY=<google-maps-browser-key>
VITE_HCAPTCHA_SITE_KEY=<hcaptcha-site-key>
VITE_CLAUDABLE_URL=https://your-self-hosted-claudable.example.com/?embed=1
VITE_FRAPPE_URL=https://your-self-hosted-frappe.example.com/?embed=1
VITE_VERCEL_TOKEN=<vercel-api-token>
```

- Values prefixed with `VITE_` become part of the browser bundle—only include keys safe for public use.
- `VITE_CLAUDABLE_URL` is optional; if omitted, the admin builder defaults to the public Claudable sandbox.
- `VITE_FRAPPE_URL` is optional; if omitted, the Frappe designer defaults to the public Frappe URL.
- `VITE_VERCEL_TOKEN` is optional; if omitted, you can configure it directly in the Vercel Site Editor UI. This token is stored in localStorage for convenience.
- After editing, restart `npm run dev` locally (or redeploy on Vercel) so Vite rebuilds with the new values.

## Supabase Edge Functions (`supabase/.env`)

Create `/Users/Darren/Downloads/owldoor-1060dde5-main/supabase/.env` (used by `supabase functions serve`) and `/Users/Darren/Downloads/owldoor-1060dde5-main/supabase/.env.production` if you want a separate set for production deploys. At minimum include:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Add provider secrets as needed by the specific functions you plan to run (Stripe, Twilio, SendGrid, Resend, Anthropic, etc.). Use the function code to see which keys are required, e.g.:

```
rg "Deno.env.get" supabase/functions -g "*.ts"
```

When serving locally:

```
supabase functions serve --env-file supabase/.env
```

## Vercel Environment Variables

Set the same `VITE_*` variables in the Vercel dashboard or CLI:

```
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
vercel env add VITE_SUPABASE_PROJECT_ID
vercel env add VITE_GOOGLE_MAPS_API_KEY
vercel env add VITE_HCAPTCHA_SITE_KEY
vercel env add VITE_CLAUDABLE_URL
vercel env add VITE_FRAPPE_URL
vercel env add VITE_VERCEL_TOKEN
```

Repeat the command for each value, providing the same string you placed in `.env.local`. Use Vercel's "Preview" and "Production" environments if the values differ.

**Note:** For Vercel token, you can also configure it directly in the admin panel under "Vercel Sites" view. The token is stored securely in localStorage.

### Sync to Local

After adding the variables in Vercel, you can pull them into a local file to keep parity:

```
vercel env pull .env.local
```

> Be careful not to commit `.env.local` to git.

## Supabase Project Secrets

Use Supabase CLI to push server-side secrets:

```
supabase secrets set \
  SUPABASE_URL=https://<project-ref>.supabase.co \
  SUPABASE_ANON_KEY=<anon-key> \
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
  STRIPE_SECRET_KEY=<optional> \
  TWILIO_ACCOUNT_SID=<optional> \
  TWILIO_AUTH_TOKEN=<optional> \
  SENDGRID_API_KEY=<optional> \
  ...
```

Run `supabase secrets list` afterward to confirm they’re saved. These secrets power the edge functions running on Supabase and stay server-side—do **not** add them to Vercel.

## Deployment Checklist

- [ ] `npm install`
- [ ] `vercel link` (once per project)
- [ ] `vercel env add ...` for all frontend variables
- [ ] `supabase login` and `supabase link --project-ref oouyhixnjwjnombgcyjl`
- [ ] `supabase secrets set ...` for server-side keys
- [ ] `npm run build` locally to confirm
- [ ] `vercel --prod` to deploy the frontend
- [ ] `supabase functions deploy <name>` for any updated edge functions

