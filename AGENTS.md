# AGENTS.md — Pacific Alpacas

The engineering guide for this repo lives in one place: **[CLAUDE.md](./CLAUDE.md)**. Read that file first — everything in it (architecture, schema, engineering principles, security, testing, workflow) applies equally regardless of which coding agent you are.

This file used to be a full copy of that guide, kept "in sync" by hand for Codex specifically. It drifted — twice-fixed facts (the `app_role` enum, TypeScript strict mode) went stale here while CLAUDE.md moved on, because there were two places to remember to update instead of one. Don't recreate that: if something Codex-specific needs documenting, add it below as a pointer or a short delta, not a duplicate of CLAUDE.md's content.

## Codex-specific notes

When starting a session:
```bash
codex --context CLAUDE.md
```

Section pointers for common tasks (adding a page, fixing a bug, database work, security review, etc.) are listed in CLAUDE.md §24.
