# pi-teardown-screen

A slim [pi](https://github.com/earendil-works/pi) coding agent extension that
prints a session **teardown screen** with a resume command and stats (turns,
tokens, cost, duration) when you quit a pi session.

This is a stripped-down extraction of the `teardown` extension from
[`pi-extensions`](https://github.com/furbyhaxx/pi-extensions): same look and
behavior as that extension running on its **default config**, but with:

- **Zero configuration** — no settings, flags, or env vars to tune.
- **No custom theme** — uses pi's default theme tokens (`accent`, `muted`,
  `text`) so it adapts to whatever theme is active.

## Install

Pick one:

```sh
# Local clone (this repo)
pi install /path/to/pi-teardown-screen

# Or as a project-scoped install
pi install -l /path/to/pi-teardown-screen
```

Or load directly without installing:

```sh
pi -e /path/to/pi-teardown-screen/extensions/teardown/index.ts
```

## What it shows

On `quit` of an interactive session, it writes to stderr:

```
╭────╮  Project: ~/work/example
│ Pi │  Session: 01J...abc
╰────╯  Title:   refactoring auth module

        Resume:  pi --session 01J...abc

        4 turns · 12.3k tokens · $0.04 · 2m 17s
```

## Behavior

- Triggers on `session_shutdown` with `reason === "quit"` only (not on
  `/new`, `/fork`, `/resume`, etc.).
- Skipped when there is no UI (e.g. `--mode json`, `-p`).
- Sections rendered, in order: `project`, `session`, `title` (if set),
  `resume`, `stats` (turns, tokens, cost, duration).
- Layout: compact (logo + key/value rows side by side, then a stats row).

## Build

`tsc --noEmit` — no build artifacts are produced; pi loads the `.ts` source
directly via `jiti`.

```sh
npm install
npm run build
```

## License

MIT
