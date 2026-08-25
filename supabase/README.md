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

## Email code sign-in

FrankCards accepts both the hosted provider's secure email link and a short email code. Push the hosted Auth configuration with:

```bash
supabase config push
```

The checked-in development Site URL is `http://localhost:1420`. Change it and the redirect allow-list before deploying the app to a public domain.

The optional templates in `supabase/templates` print `{{ .Token }}` for both existing and new users. New Free projects cannot customize these templates while using Supabase's default email provider. Configure custom SMTP first, then add the template sections to `config.toml` before pushing them.
