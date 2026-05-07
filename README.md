# scout

> Save your Claude Code setup once. Apply it anywhere in one command.

```bash
npm install -g scout-cc
```

> The `scout` command is available after install.

Scout snapshots your `CLAUDE.md`, rules, skills, and `settings.json` into a named preset — then lets you stamp that exact setup into any new project instantly.

---

## Why

Every new project means the same manual setup: copy `CLAUDE.md`, drop in your favourite skills, wire up `settings.json`. Scout turns that into a single command.

```bash
# Save your current setup
scout save backend-ts

# Apply it to a new project
cd ~/projects/new-api && scout use backend-ts
```

---

## What gets saved

Scout manages the Claude Code files in your project:

| File | What it does |
|---|---|
| `CLAUDE.md` | Main instructions for Claude |
| `.claude/rules/` | Path-scoped rules |
| `.claude/skills/` | On-demand skills |
| `.claude/settings.json` | MCP servers, hooks, permissions |

Everything is stored as plain files in `~/.scout/presets/` — inspect them, back them up, or share them like any other directory.

---

## Quick start

```bash
# 1. Go to a project with a setup you like
cd ~/projects/my-api

# 2. Save it
scout save backend-ts --description "Node/TypeScript backend"

# 3. Apply it to a new project
cd ~/projects/new-api
scout use backend-ts
```

That's it. All your Claude config is now in the new project.

---

## Commands

### `scout save <name>`

Snapshot the current project's Claude setup as a named preset.

```bash
scout save <name> [options]
```

| Option | Default | Description |
|---|---|---|
| `-d, --description <text>` | — | Short description shown in `scout list` |
| `-t, --tags <list>` | — | Comma-separated tags (e.g. `typescript,backend`) |
| `--overwrite` | false | Replace an existing preset with the same name |

```bash
scout save backend-ts
scout save fullstack --description "Next.js + tRPC + Postgres" --tags typescript,web
scout save backend-ts --overwrite          # refresh after refining your setup
```

Requires a `CLAUDE.md` in the current directory. Nothing in your project is modified.

---

### `scout use <preset>`

Apply a saved preset to the current directory.

```bash
scout use <preset> [options]
```

| Option | Default | Description |
|---|---|---|
| `--merge` | false | Only copy files that don't exist yet — never overwrite |
| `--dry-run` | false | Preview what would be written without touching anything |
| `--force` | false | Skip the confirmation prompt |

```bash
scout use backend-ts                       # full apply
scout use backend-ts --merge              # safe: only fills in missing files
scout use backend-ts --dry-run            # preview before committing
scout use backend-ts --merge --dry-run    # preview + safe mode
```

After applying, scout writes a `.scout-applied` marker file. Add it to `.gitignore` if you don't want to commit it.

---

### `scout list`

Show all available presets.

```bash
scout list [--json]
```

```
name            skills  description
backend-ts           2  Node/TypeScript backend with PostgreSQL
fullstack            4  Next.js + tRPC + Postgres
data-science         1  Python data science setup
```

Use `--json` for scripting or CI pipelines.

---

### `scout clean`

Remove presets or cached data you no longer need.

```bash
scout clean [options]
```

| Option | Description |
|---|---|
| `--preset <name>` | Delete one preset and its registry entry |
| `--orphans` | Fix broken links — removes dirs with no registry entry and vice versa |
| `--cache` | Delete `~/.scout/scan-cache.json` |
| `--all` | Wipe everything under `~/.scout` |
| `--dry-run` | Show what would be deleted without deleting |

```bash
scout clean --preset old-preset            # remove one preset
scout clean --orphans                      # tidy up broken references
scout clean --all --dry-run               # preview a full wipe
scout clean --all                         # start fresh
```

---

## Data layout

```
~/.scout/
├── presets/
│   └── backend-ts/
│       ├── CLAUDE.md
│       └── .claude/
│           ├── rules/
│           ├── skills/
│           └── settings.json
├── registry.json        ← index of all presets + metadata
└── scan-cache.json      ← optional cache (deletable anytime)
```

Each preset is a plain directory. You can open it in your editor, copy it to another machine, or commit it to a repo.

---

## Workflows

### Update a preset after refining your setup

```bash
cd ~/projects/my-api
# tweak CLAUDE.md, add a skill, adjust settings...
scout save backend-ts --overwrite
```

### Apply to a project that already has Claude config

```bash
# Preview first
scout use design-system --merge --dry-run

# Apply only what's missing — never overwrites existing files
scout use design-system --merge
```

### Share presets with your team

```bash
# Send
cp -r ~/.scout/presets/backend-ts ./shared/

# Receive (on another machine)
mkdir -p ~/.scout/presets
cp -r ./shared/backend-ts ~/.scout/presets/
```

> `scout export` / `scout import` commands are on the roadmap.

---

## Requirements

- Node.js 18 or later
- A `CLAUDE.md` file in your project (required for `scout save`)

---

## License

Business Source License 1.1 — free for personal and non-commercial use. Commercial use requires a separate license. Converts to Apache 2.0 four years after each release. See [LICENSE](LICENSE) for full terms.
