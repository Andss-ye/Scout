# Contributing to Scout

Thanks for your interest in contributing! This guide covers everything you need to go from zero to your first pull request.

---

## Setup

**Prerequisites:** Node.js 18+, npm

```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/Scout.git
cd Scout

# 2. Install dependencies
npm install

# 3. Run Scout locally
npm run dev -- list
```

`npm run dev` runs the CLI directly via `tsx` — no build step needed during development.

---

## Project structure

```
src/
├── cli.ts              # Entry point, registers all commands
├── commands/           # One file per CLI command (save, use, list, clean)
├── core/               # Business logic (preset manager, registry, etc.)
├── utils/              # Shared helpers (fs, paths, output formatting)
└── types/              # TypeScript types and interfaces

tests/
├── preset-manager.test.ts
├── file-applier.test.ts
├── cleaner.test.ts
└── spec.test.ts
```

---

## Development workflow

### Make a change

```bash
# Run a command locally
npm run dev -- save my-preset
npm run dev -- list
npm run dev -- use my-preset --dry-run
```

### Run tests

```bash
npm test
```

### Build

```bash
npm run build
```

The output goes to `dist/`. The `build` script also makes `dist/cli.js` executable.

---

## How to contribute

### Reporting a bug

1. Search [existing issues](https://github.com/andss-ye/Scout/issues) first.
2. Open a new issue with:
   - What you ran
   - What you expected
   - What actually happened
   - Node.js version and OS

### Suggesting a feature

Open an issue with the **enhancement** label. Describe the use case — what problem it solves and how you'd expect it to work.

### Submitting a pull request

1. **Open an issue first** for anything beyond a small fix — it's worth aligning before you write code.
2. Fork the repo and create a branch:
   ```bash
   git checkout -b fix/dry-run-output
   # or
   git checkout -b feat/export-command
   ```
3. Make your changes. Add or update tests if relevant.
4. Run `npm test` — all tests must pass.
5. Commit following the format below.
6. Push and open a PR against `main`.

---

## Commit format

```
<type>: <short description>
```

| Type | When to use |
|------|-------------|
| `feat` | New behavior |
| `fix` | Bug fix |
| `refactor` | Internal change, no behavior change |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `chore` | Build, config, dependencies |

Examples:
```
feat: add scout export command
fix: dry-run now shows correct file count
docs: add contributing guide
```

---

## Adding a new command

1. Create `src/commands/your-command.ts`
2. Export a function that accepts a `Command` instance (from `commander`)
3. Register it in `src/cli.ts`
4. Add tests in `tests/`

Look at an existing command (e.g. `src/commands/list.ts`) for the pattern to follow.

---

## Code style

- TypeScript strict mode is enabled — no `any` unless unavoidable
- Prefer immutable patterns (return new objects, don't mutate in place)
- Keep functions small and files focused
- No comments that just restate what the code does

---

## Questions?

Open an issue or start a discussion. Happy to help.
