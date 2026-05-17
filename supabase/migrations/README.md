# Supabase Migrations

This project uses a single canonical schema file rather than a chain of
incremental migrations. To bring a Supabase project to the current
schema, run:

```
supabase/schema.sql
```

in the Supabase SQL editor (or via `supabase db push`). The file is
fully idempotent and creates only what is missing.

## Optional seed data

If you also want the default catalog (categories + sample products):

```
supabase/migrations/0002_seed.sql
supabase/migrations/0004_seed_products.sql
```

These can be run once after `schema.sql`. They use `on conflict do
nothing` / `do update` clauses so they are safe to re-run, but they
will overwrite category and product rows with the default copy if you
have customised them.

## `archive/`

The `archive/` subfolder contains the historical incremental migration
files (0001 — 0013). They are kept for reference but should **not** be
run on a new Supabase project — `schema.sql` supersedes all of them.
