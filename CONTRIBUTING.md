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

## The five checks

Run these before you push. `make check` runs all five and keeps going after a
failure, so one run tells you everything that is broken.

```bash
cd nuvola-atlas-backend  && php vendor/phpunit/phpunit/phpunit --no-coverage
cd nuvola-atlas-backend  && vendor/bin/phpstan analyse --memory-limit=512M
cd nuvola-atlas-frontend && npm run typecheck
cd nuvola-atlas-frontend && npm test
cd nuvola-atlas-frontend && npm run build
```

Two things to know before you read a result:

- **phpunit needs Postgres.** `phpunit.xml` force-pins to `127.0.0.1:5434`, so
  without the container the suite does not fail — it hangs on a TCP timeout.
  `make db` starts it. `make check` checks the port first and tells you.
- **phpstan is red and that is expected.** 158 pre-existing violations at
  level 5. It is informational in CI and in `make check`, and the count is
  printed so it cannot creep upward unnoticed. Do not lower the level to make
  it green — see A5 in [`tasks/todo.md`](tasks/todo.md).

## Formatting

Formatters run automatically on staged files via the pre-commit hook. To run
them by hand: `make fmt` rewrites, `make lint` checks without rewriting.

| Service | Formatter | Config |
|---|---|---|
| Backend | Pint (PSR-12 + `declare_strict_types`) | `nuvola-atlas-backend/pint.json` |
| Frontend | Prettier, then ESLint | `.prettierrc.json`, `eslint.config.js` |
| Ingestion | ruff, then mypy strict | `pyproject.toml` |

Pint and Prettier are **blocking** in CI. ESLint is blocking and currently
fails on 44 pre-existing errors — fix or narrow the preset before relying on
it as a gate.

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

Branch off `main`. `main` is protected — see
[`docs/ops/branch-protection.md`](docs/ops/branch-protection.md).

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

Scopes in use: `api`, `backend`, `frontend`, `ingestion`, `investor`, `db`,
`ci`, `dev-ux`, `scorecard`, `repo`, `github`, `todo`.

Two rules that matter more than the format:

- **One logical change per commit.** A mechanical reformat and a behaviour
  change never belong in the same commit — nobody can review the second
  through the noise of the first.
- **Say what you verified, not what you intended.** If you could not run a
  check, write that down. `1d351f6` and `b189d43` are the reference examples.

## Pull requests

The template asks which of the five checks you ran and leaves room to say why
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
