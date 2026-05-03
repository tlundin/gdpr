# GDPR myndighetsverktyg (MVP)

Webbapp för svenska myndigheter: ärenden, uppladdning av handlingar, textextraktion (PDF/txt), anteckningar för bedömning och revisionslogg per **tenant**. Fakturering kan kopplas till **Stripe** (engång/år) eller **avtal/faktura** via samma datamodell.

Detta är **inte** juridisk rådgivning; ansvaret för utlämning och personuppgiftsbehandling ligger hos er organisation.

## Krav

- Node.js 20+
- Docker (för PostgreSQL lokalt) eller egen Postgres i EU/EES

## Kom igång

1. Kopiera miljövariabler:

   ```bash
   copy .env.example .env
   ```

   Sätt `DATABASE_URL` och `AUTH_SECRET` (t.ex. `openssl rand -base64 32`).

2. Starta databas:

   ```bash
   docker compose up -d
   ```

   Exempel-URL:

   ```env
   DATABASE_URL="postgresql://gdpr:gdpr@localhost:5432/gdpr_myndighet?schema=public"
   ```

3. Installera och migrera:

   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

4. Utvecklingsserver:

   ```bash
   npm run dev
   ```

5. Logga in med seed-användaren:

   - E-post: `demo@example.com`
   - Lösenord: `demo12345`

## OpenAI — automatisk analys (valfritt)

1. Skapa en API-nyckel i [OpenAI Platform](https://platform.openai.com/api-keys) (organisations- och faktureringskonto enligt er process).
2. Lägg **endast** i **serverns** `.env` (committa aldrig nyckeln):

   ```env
   OPENAI_API_KEY="sk-..."
   # valfritt:
   OPENAI_MODEL="gpt-4o-mini"
   ```

3. Kör om appen så att variablerna laddas (`npm run dev` lokalt, eller `sudo systemctl restart gdpr` på er Linux-värd).
4. I dokumentvyn: **Starta automatisk analys**. Texten skickas till OpenAI — genomför **DPIA** och **biträdesavtal** innan skarp drift med verkliga personuppgifter.

## Stripe (valfritt)

Fyll i `STRIPE_*` i `.env`. Webhook-ändpunkt: `/api/stripe/webhook` — konfigurera i Stripe Dashboard med samma `STRIPE_WEBHOOK_SECRET`.

Vid `checkout.session.completed` förväntas `metadata.tenantId` (och valfritt `metadata.productType` = `ONE_TIME` | `ANNUAL`) om ni kopplar Checkout till befintlig tenant.

## Produktion

- Hosta i **EU/EES**
- Genomför DPIA och personuppgiftsbiträdesavtal
- Byt från lokala filer (`uploads/`) till krypterat objektlager (S3-kompatibelt)
- Sätt starka lösenord och organisations-IDP om möjligt
