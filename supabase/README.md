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

Supabase's default email delivery is intended for development and may be rate-limited. Configure custom SMTP before production use.

### Hosted email templates

Database migrations do not upload hosted Auth email templates. In the Supabase Dashboard, open **Authentication → Emails → Templates**, then update these templates:

- **Confirm signup**: subject `Confirm your FrankCards account`; paste `supabase/templates/confirmation.html`.
- **Reset password**: subject `Reset your FrankCards password`; paste `supabase/templates/recovery.html`.
- **Magic link**: subject `Your FrankCards sign-in link`; paste `supabase/templates/magic_link.html` if magic-link login is enabled later.

Save each template separately. The HTML uses Supabase's `{{ .ConfirmationURL }}` variable, includes a plain fallback link, and carries the FrankCards signature. The handwritten wordmark is served as a PNG from the public GitHub repository through jsDelivr for broad email-client support, so push `public/frank-signature-email.png` before testing the hosted templates. The matching entries in `supabase/config.toml` apply to the local Supabase stack after restarting it with `supabase stop && supabase start`.

## Community review workflow

User-created topics are private drafts by default. A creator can submit a draft for review, but cannot publish it directly. An administrator can preview the pending topic and either:

- approve it, which publishes it in **Custom mode → Community**;
- reject it with feedback, which returns it to the creator as a private topic.

Editing an approved topic returns it to a private draft, so a new version must be reviewed again. Row-level security and the review RPC enforce this on the database, not only in the interface.

After applying the review migrations, promote the first administrator from the hosted project's SQL Editor. Replace the email with the account that should see the review panel:

```sql
update public.profiles as profile
set is_admin = true
from auth.users as auth_user
where profile.id = auth_user.id
  and auth_user.email = 'admin@example.com';
```

Use the same query with `is_admin = false` to remove review access.
