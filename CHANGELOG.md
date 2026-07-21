# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This file starts now (2026-07-21) — it does not retroactively document the project's full history. See `git log` for that.

## [Unreleased]

## [1.0.0] - 2026-07-21

### Added
- `SECURITY.md`, `.github/dependabot.yml`, `.github/CODEOWNERS`, `LICENSE`, `.editorconfig`, this changelog.
- Husky + lint-staged pre-commit hook (lint + type-check staged/changed files before commit).

### Changed
- `AGENTS.md` and `DEVELOPMENT_GUIDE.md` now point to `CLAUDE.md` instead of duplicating it, to stop the two from drifting apart.
- First tagged version — `package.json` moves from the Vite scaffold default `0.0.0` to `1.0.0`, marking this as the baseline for future changes.
