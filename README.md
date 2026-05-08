# Scout

**Save your Claude Code setup once. Apply it anywhere.**

```bash
npm install -g scout-cc
```

Scout snapshots your `CLAUDE.md`, rules, skills, and `settings.json` into a named preset — and stamps that exact setup into any new project with one command.

---

## The problem

Every new project means the same manual setup: copy `CLAUDE.md`, drop in your favorite skills, wire up `settings.json`. Scout turns that into one command.

---

## Quick start

```bash
# 1. Go to a project with a setup you like
cd ~/projects/my-api

# 2. Save it as a preset
scout save backend-ts --description "Node/TypeScript backend"

# 3. Apply it to any new project
cd ~/projects/new-api
scout use backend-ts
```

Done. All your Claude config is now in the new project.

---

## Commands

### `scout save <name>`

Snapshot the current project's Claude setup.

```bash
scout save backend-ts
scout save fullstack --description "Next.js + tRPC + Postgres" --tags typescript,web
scout save backend-ts --overwrite   # refresh after tweaking your setup
```

> Requires a `CLAUDE.md` in the current directory. Nothing in your project is modified.

| Option | Description |
|--------|-------------|
| `-d, --description <text>` | Short description shown in `scout list` |
| `-t, --tags <list>` | Comma-separated tags (e.g. `typescript,backend`) |
| `--overwrite` | Replace an existing preset with the same name |

---

### `scout use <preset>`

Apply a saved preset to the current directory.

```bash
scout use backend-ts                    # full apply
scout use backend-ts --merge           # only fill in missing files, never overwrite
scout use backend-ts --dry-run         # preview before touching anything
scout use backend-ts --merge --dry-run # preview in safe mode
```

| Option | Description |
|--------|-------------|
| `--merge` | Only copy files that don't exist yet |
| `--dry-run` | Preview what would be written without touching anything |
| `--force` | Skip the confirmation prompt |

After applying, Scout writes a `.scout-applied` marker. Add it to `.gitignore` if you don't want to commit it.

---

### `scout list`

Show all saved presets.

```bash
scout list
scout list --json   # for scripting or CI
```

```
name            skills  description
backend-ts           2  Node/TypeScript backend with PostgreSQL
fullstack            4  Next.js + tRPC + Postgres
data-science         1  Python data science setup
```

---

### `scout clean`

Remove presets or cached data you no longer need.

```bash
scout clean --preset old-name      # delete one preset
scout clean --orphans              # fix broken references
scout clean --all --dry-run        # preview a full wipe
scout clean --all                  # start fresh
```

| Option | Description |
|--------|-------------|
| `--preset <name>` | Delete one preset and its registry entry |
| `--orphans` | Remove dirs with no registry entry and vice versa |
| `--cache` | Delete `~/.scout/scan-cache.json` |
| `--all` | Wipe everything under `~/.scout` |
| `--dry-run` | Show what would be deleted without deleting |

---

## What gets saved

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Main instructions for Claude |
| `.claude/rules/` | Path-scoped rules |
| `.claude/skills/` | On-demand skills |
| `.claude/settings.json` | MCP servers, hooks, permissions |

Everything lives in `~/.scout/presets/` as plain files — inspect them, back them up, or share them like any directory.

```
~/.scout/
├── presets/
│   └── backend-ts/
│       ├── CLAUDE.md
│       └── .claude/
│           ├── rules/
│           ├── skills/
│           └── settings.json
├── registry.json       ← index of all presets + metadata
└── scan-cache.json     ← optional cache (safe to delete)
```

---

## Common workflows

**Update a preset after refining your setup**
```bash
cd ~/projects/my-api
# tweak CLAUDE.md, add a skill...
scout save backend-ts --overwrite
```

**Apply to a project that already has Claude config**
```bash
scout use design-system --merge --dry-run   # preview first
scout use design-system --merge             # only fills in missing files
```

**Share presets with your team**
```bash
# Send
cp -r ~/.scout/presets/backend-ts ./shared/

# Receive (on another machine)
mkdir -p ~/.scout/presets && cp -r ./shared/backend-ts ~/.scout/presets/
```

> `scout export` / `scout import` commands are on the roadmap.

---

## Requirements

- Node.js 18+
- A `CLAUDE.md` in your project (required for `scout save`)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## License

BSL 1.1 — free for personal and non-commercial use. Converts to Apache 2.0 four years after each release. See [LICENSE](LICENSE).
