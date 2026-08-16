## What changed

<!-- What this does and why. Link the tasks/todo.md item or sprint task if there is one. -->

## Checks

Tick only what you actually ran. If a check was not run, say why rather than
leaving the box empty — "not run, no Docker on this machine" is a useful
review signal; a blank box is not.

- [ ] `cd nuvola-atlas-backend && php vendor/phpunit/phpunit/phpunit --no-coverage`
- [ ] `cd nuvola-atlas-backend && vendor/bin/phpstan analyse --memory-limit=512M`
- [ ] `cd nuvola-atlas-frontend && npm run typecheck`
- [ ] `cd nuvola-atlas-frontend && npm test`
- [ ] `cd nuvola-atlas-frontend && npm run build`

<!-- `make check` from the repo root runs all five. -->

Not run, and why:

## Screenshots

<!-- Required for any user-visible change. Before and after. -->

## No surface states something it does not know

- [ ] Nothing in this PR displays a number, status or timestamp it has not
      actually measured.

That means: no placeholder that reads as real data, no hardcoded "Operational"
or "Last synced" string, no estimated value rendered identically to a measured
one, and no CI step that reports success without inspecting anything. If this
PR adds an estimate or a fallback, it is marked as one in the UI.

## Migrations

- [ ] Not applicable
- [ ] Includes both `up()` and `down()`, and `down()` was tested by rolling back
