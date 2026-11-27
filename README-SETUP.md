# Aadhya Fashions Studios — setup

## Run on your computer
1. Install Node.js (nodejs.org), then in this folder run:  `npm install -g pnpm` then `pnpm install`
2. Copy `.env.example` to `.env.local` and fill in OWNER_EMAIL, OWNER_PASSWORD, OWNER_SESSION_SECRET.
3. `pnpm dev` → open http://localhost:3000   (owner dashboard: /owner/login)

## Put it on Vercel
Push this folder to GitHub (or run `vercel`), then add the same variables in
Vercel → Project → Settings → Environment Variables, and redeploy.

## Check Live (virtual try-on)
1. Create an account at platform.decart.ai and make an API key.
2. Add it as DECART_API_KEY in `.env.local` and in Vercel (never in code).
3. Run `pnpm install` once so the lockfile includes `@decartai/sdk`, then commit `pnpm-lock.yaml` too
   (otherwise Vercel's install fails with a "lockfile not up to date" error).
4. Camera needs HTTPS (Vercel provides it; localhost also works). Previews stop after 2 minutes to limit cost —
   also set a spend limit in your Decart dashboard.

## WhatsApp order alerts (automatic)
Uses Meta's official WhatsApp Cloud API. Customers' orders are sent to YOUR WhatsApp automatically.
1. developers.facebook.com → create an app → add "WhatsApp" → note the **Phone Number ID** and make a **permanent access token**
   (System User token). Use a number that is not already on the normal WhatsApp app.
2. WhatsApp Manager → Message templates → create a **Utility** template named `new_order_alert`, language English, body:
   `New order {{1}} from {{2}} ({{3}}). Items: {{4}}. Total: {{5}}. Payment: {{6}}. Deliver to: {{7}}`
   Wait until Meta approves it (Meta requires an approved template for messages the business starts).
3. Add to `.env.local` and Vercel: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, OWNER_WHATSAPP_TO (your number with country code,
   digits only), WHATSAPP_TEMPLATE_NAME, WHATSAPP_TEMPLATE_LANG. Redeploy.
4. Owner dashboard → Settings → **Send test WhatsApp alert**.
Without a template, plain text is only delivered if you messaged the business number in the last 24 hours (fine for first tests).
Meta charges per template conversation — check current pricing in WhatsApp Manager.

## PhonePe payments (automatic "Payment successful")
1. Sign up for PhonePe Payment Gateway (business.phonepe.com), complete KYC, and get your sandbox then production
   Client ID, Client Secret and Client Version.
2. Add PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION and PHONEPE_ENV (sandbox or production)
   to `.env.local` and Vercel, then redeploy. Set NEXT_PUBLIC_SITE_URL to your live address.
3. Checkout then shows "PhonePe / UPI (Pay Online)". The order is marked Paid only after our server asks PhonePe
   and PhonePe confirms the payment AND the amount matches.

## AI Style Ideas (owner tool)
1. aistudio.google.com > Get API key (free, no card). Add GEMINI_API_KEY to `.env.local` and Vercel, then restart/redeploy.
2. Owner dashboard > Add / Update Stocks > "Style Ideas (AI)" (or the sparkle link inside the product form).
3. Upload a clear cloth photo, tick up to 6 styles, press Generate. Results are AI concepts. Free limits can change.

## AI Style Ideas — Cloudflare (free, recommended)
1. Sign up free at dash.cloudflare.com (no card). Copy your **Account ID** (right side of the Workers & Pages page).
2. Workers AI page > "Use REST API" > **Create a Workers AI API Token**. Copy it.
3. Put CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in `.env.local` and Vercel. Restart/redeploy.
4. The free daily allowance resets at 00:00 UTC (5:30 AM India time).

## AI Style Ideas — automatic backup chain
Services are tried in order (IMAGE_PROVIDER_ORDER). If one is out of credits/limit, the next starts by itself.
If ALL are used up, the owner sees "AI credits are over". Services without a key are skipped.
- Cloudflare: free daily allowance (best for long-term). Gemini: free tier with limits.
- Stability AI (platform.stability.ai): one-time free credits at sign-up. Replicate: pay per image.
- Hugging Face and Pollinations are NOT included: HF free credits are under $0.10/month, and Pollinations
  needs a public link to the cloth photo (needs online image storage — comes with the database step).

## Razorpay (later)
Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel. "Pay Online (Razorpay)" appears
at checkout automatically; orders become Paid only after server-side signature verification.

## Trial-mode limit
Customer accounts, orders, bookings, reviews, stock edits and settings are stored in the
browser (localStorage). The owner sees them only in the same browser. For real use across
devices, connect a hosted database (e.g. Supabase) — all data goes through lib/store.tsx.
