# pi-teardown-screen

A slim [pi](https://github.com/earendil-works/pi) coding agent extension that
prints a session **teardown screen** with a resume command and stats (turns,
tokens, cost, duration) when you quit a pi session.

It provides the compact default teardown layout with:

- **Zero configuration** — no settings, flags, or env vars to tune.
- **No custom theme** — uses pi's default theme tokens (`accent`, `muted`,
  `text`) so it adapts to whatever theme is active.

## Install

Install from npm:

```sh
pi install npm:@furbyhaxx/pi-teardown-screen
```

Or install from GitHub:

```sh
pi install git:https://github.com/furbyhaxx/pi-teardown-screen
```

Or clone the repo and install from the local checkout:

```sh
git clone https://github.com/furbyhaxx/pi-teardown-screen
pi install path/to/cloned/repo
```

Or load directly without installing:

```sh
pi -e path/to/cloned/repo/extensions/teardown/index.ts
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
