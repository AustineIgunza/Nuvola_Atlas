# Contributing

Three services, three toolchains. See [`README.md`](README.md) for what each
directory is and who owns it.

## Setup

```bash
git clone <repo> && cd NUVOLA_ATLAS
make hooks                                     # install the pre-commit hook

cd nuvola-atlas-backend  && composer install
cd ../nuvola-atlas-frontend && npm ci
cd ../nuvola-atlas-ingestion && pip install -e ".[dev]"
```

`make` is not installed on Windows by default. Every target is a one-line
alias — run `make help` to see them, or read the `Makefile` and run the
command directly. `make check` is the one worth an alias of your own:

```bash
bash scripts/check.sh
```

## The checks

Run these before you push. `make check` runs them all and keeps going after a
failure, so one run tells you everything that is broken.

```bash
node scripts/gen-pillars.mjs --check
node scripts/check-zones.mjs
bash scripts/check-freedom-index.sh
cd nuvola-atlas-backend   && php vendor/phpunit/phpunit/phpunit --no-coverage
cd nuvola-atlas-backend   && vendor/bin/phpstan analyse --memory-limit=512M
cd nuvola-atlas-frontend  && npm run typecheck
cd nuvola-atlas-frontend  && npm test
cd nuvola-atlas-frontend  && npm run build
cd nuvola-atlas-ingestion && ruff check . && pytest --no-header -ra
cd nuvola-atlas-data      && ruff check . && pytest --no-header -ra
```

Things to know before you read a result:

- **The registry check is drift detection, not a test.** `pillars.json` at the
  root generates the pillar taxonomy into all three packages. If you edited a
  generated file by hand instead of the JSON, this is what catches it. Re-run
  without `--check` to regenerate.
- **The Python services need their dev extras installed.** `make check` looks for
  `ruff` and `pytest` in each project's `.venv/bin` first, then on `PATH`, and
  fails with the install command if it finds neither — it does not skip them:

  ```bash
  cd nuvola-atlas-data && python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"
  ```

- **Use Node 20 — `.nvmrc` pins it and CI matches.** `package.json` says
  `>=20.0.0`, which is too loose to protect you. On Node 26, vitest 2.1.9's jsdom
  environment does not populate `localStorage`, so 14 tests fail with
  `Cannot read properties of undefined (reading 'getItem')` in
  `src/api/client.ts` and `src/stores/chrome.ts`. The app code is fine —
  the same suite is 60/60 green on Node 20. If you see that error, check
  `node --version` before you debug anything else.

  ```bash
  nvm use
  ```
- **phpunit needs Postgres.** `phpunit.xml` force-pins to `127.0.0.1:5434`, so
  without the container the suite does not fail — it hangs on a TCP timeout.
  `make db` starts it. `make check` checks the port first and tells you.
- **phpstan is red and that is expected.** 154 pre-existing violations at
  level 5. It is informational in CI and in `make check`, and the count is
  printed so it cannot creep upward unnoticed. Do not lower the level to make
  it green.

## Formatting

Formatters run automatically on staged files via the pre-commit hook. To run
them by hand: `make fmt` rewrites, `make lint` checks without rewriting.

| Service | Formatter | Config |
|---|---|---|
| Backend | Pint (PSR-12 + `declare_strict_types`) | `nuvola-atlas-backend/pint.json` |
| Frontend | Prettier, then ESLint | `.prettierrc.json`, `eslint.config.js` |
| Ingestion | ruff, then mypy strict | `pyproject.toml` |

Pint and Prettier are **blocking** in CI. ESLint is blocking and currently
fails on 26 pre-existing errors (plus 10 warnings) — fix or narrow the preset
before relying on it as a gate.

`NuvolaAtlasPrototype.jsx` is the frozen design spec. Do not reformat it; it
sits outside every lint and format glob on purpose.

## Branches

```
feat/short-description
fix/short-description
chore/short-description
docs/short-description
ci/short-description
```

Branch off `main`. `main` is protected: PRs only, the blocking checks must
pass, and force-push is off.

## Commits

Conventional Commits, matching what is already in `git log`:

```
feat(investor): ESG lens toggle + capital-allocation row
fix(api): stop caching the zones paginator
ci(backend): make Pint blocking
docs(todo): correct A5
style(backend): apply the first Pint pass
chore(repo): add .gitattributes and .editorconfig
```

Scopes in use: `api`, `backend`, `frontend`, `ingestion`, `pillars`, `scoring`,
`scorecard`, `investor`, `admin`, `chat`, `audit`, `health`, `db`, `ops`, `ci`,
`deps`, `dev-ux`, `brand`, `legal`, `repo`, `github`, `tasks`.

`git log --format=%s | sed -n 's/^[a-z]*(\([a-z-]*\)).*/\1/p' | sort -u` is the
live list; prefer an existing scope over inventing one.

Two rules that matter more than the format:

- **One logical change per commit.** A mechanical reformat and a behaviour
  change never belong in the same commit — nobody can review the second
  through the noise of the first.
- **Say what you verified, not what you intended.** If you could not run a
  check, write that down. `1d351f6` and `b189d43` are the reference examples.

## Pull requests

The template asks which of the six checks you ran and leaves room to say why
one was skipped. "Not run, no Docker on this machine" is a useful review
signal; a blank checkbox is not.

One approval required, from the code owner for the paths you touched.

## The one principle

**No surface may state something it does not know.**

No placeholder that reads as real data. No hardcoded "Operational" or
"Last synced 2 minutes ago". No estimated value rendered identically to a
measured one. No CI step that reports success without inspecting anything —
this repo has shipped three of those, in `2d72333`, `fc88ad4` and `ec07fd6`,
and each one was invisible precisely because it was green.

If you find another instance, flag it. Do not silently fix it and do not
silently leave it.
