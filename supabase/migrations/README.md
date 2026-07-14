# Migration ledger notes (2026-07-15)

Every file in this folder had already been applied to the live project, but
their version numbers were never recorded in the remote migration ledger
(`supabase_migrations.schema_migrations`) — likely from schema changes made
directly via the SQL editor / MCP tooling rather than `supabase db push`.
Practically, `supabase db push` would have tried to replay all 28 files
against production: failing loudly on `CREATE TABLE` statements for objects
that already exist, and silently re-applying stale `UPDATE`-only data
migrations (e.g. re-setting product images back to ones that were
deliberately replaced later).

Fixed by inserting a ledger row for every local file's version, matching
what its content already reflects live — no SQL was re-executed, only the
bookkeeping was repaired. `supabase migration list` and `db push` should
now be clean.

Two versions exist **only** in the remote ledger with no local file:

- `20260708052524_seed_first_admin_user` — grants the `admin` role to a
  specific real user ID. Deliberately not backfilled here: baking a real
  production user ID into a migration that a fresh `supabase start` would
  also run doesn't make sense, and there's no test user to grant it to
  locally anyway. If you need admin locally, insert a `user_roles` row for
  your own local user by hand after signing up.
- `20260708063956_create_grower_applications` — pure schema, **has** been
  backfilled (see the file of the same version prefix) so `supabase start`
  produces a complete local schema.

Several early local files (the `2026032x`/`2026040x` UUID-named ones) also
overlap in content with two remote-only entries, `core_schema` and
`fix_security`, from before the project's migration files were reorganized
into their current names. Both the old squashed entries and the newer named
ones are kept in the ledger — harmless duplication, not worth untangling
further.
