# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-05-19

### Added
- Environment row in the teardown screen when a pie-managed environment can be detected from `PI_PIE_ENV` or `PI_CODING_AGENT_DIR`.

### Changed
- Resume command now prefers `pie <env> --session <id>` for sessions launched through the `pie` wrapper, while keeping `pi --session <id>` as the fallback.
- Added teardown coverage for managed-environment rendering and pie-aware resume commands.

## [0.1.0] - 2026-05-13

### Added
- Initial standalone Pi extension package published as
  `@furbyhaxx/pi-teardown-screen`.
- Pi package manifest for loading `extensions/teardown/index.ts`.
- npm publish metadata, including repository, issues, homepage, public publish
  config, package file whitelist, and MIT license file.
- Installation instructions for npm, GitHub, local clone, and direct extension
  loading.
- Session teardown screen on `session_shutdown` (reason: `quit`) showing
  project, session id, optional session title, resume command, and a
  stats row (turns, tokens, cost, duration).
- Compact layout with a boxed `Pi` logo, rendered with pi's default
  theme tokens (`accent`, `muted`, `text`).

### Removed
- All configuration surfaces (`session.teardown.*` settings).
- Custom theme tokens (`sessionTeardownLogo`, `sessionTeardownLogoDim`,
  `sessionTeardownKeys`, `sessionTeardownValues`).
- `detailed` layout, custom logo text/style, and section selection
  (now hardcoded to the default sections).
