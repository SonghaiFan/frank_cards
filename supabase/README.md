# FrankCards Supabase foundation

This folder owns the database schema and row-level security policies for user-created topics.

## Local workflow

1. Install the Supabase CLI.
2. Run `supabase start`.
3. Run `supabase db reset` to apply migrations.
4. Generate database types after every schema change:

```bash
supabase gen types typescript --local > src/data/supabase/database.types.ts
```

The checked-in `database.types.ts` mirrors the first migration so the app remains type-safe before a Supabase project is connected.

## Client configuration

Copy `.env.example` to `.env.local` and provide the project URL and publishable key. Never put a service-role key in a `VITE_` variable or in the desktop bundle.

## Email authentication

FrankCards uses email and password authentication. New accounts receive a signup confirmation link, the confirmation screen can resend that link, and the sign-in screen can send a password recovery link. After a recovery link returns to the app, the user is prompted to choose a new password.

Push the local Auth configuration to a hosted project with:

```bash
supabase config push
```

The checked-in development Site URL is `http://localhost:1420`. Both signup confirmation and password recovery redirect to the app origin, so add every development and production origin to the hosted project's Auth redirect allow-list before deployment.

Supabase's default email delivery is intended for development and may be rate-limited. Configure custom SMTP before production use. The optional templates in `supabase/templates` can be enabled after SMTP is configured.
