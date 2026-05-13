# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Updated README installation instructions to use the GitHub `pi install git:`
  source and local clone install path.

## [0.1.0] - 2026-05-13

### Added
- Initial standalone Pi extension package.
- Session teardown screen on `session_shutdown` (reason: `quit`) showing
  project, session id, optional session title, resume command, and a
  stats row (turns, tokens, cost, duration).
- Compact layout with a boxed `Pi` logo, rendered with pi's default
  theme tokens (`accent`, `muted`, `text`).

### Removed (versus source extension)
- All configuration surfaces (`session.teardown.*` settings).
- Custom theme tokens (`sessionTeardownLogo`, `sessionTeardownLogoDim`,
  `sessionTeardownKeys`, `sessionTeardownValues`).
- `detailed` layout, custom logo text/style, and section selection
  (now hardcoded to the source's default sections).
