#!/usr/bin/env bash
#
# Every check, in one place. The Makefile calls this; so can anyone without
# `make`, which includes every Windows machine on the team:
#
#   bash scripts/check.sh
#
# Runs all of them even when an early one fails, so a single run tells you
# everything that is broken rather than only the first thing.
#
# Covers all four services. Until 2026-08-27 it ran only the repo-wide
# tripwires plus backend and frontend — nuvola-atlas-ingestion and
# nuvola-atlas-data were absent here and the data service had no CI job at
# all, so its suite ran nowhere. That is how a manifest whose sha256 never
# matched its dataset survived three days unnoticed.

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
ROOT="$PWD"

BACKEND="$ROOT/nuvola-atlas-backend"
FRONTEND="$ROOT/nuvola-atlas-frontend"
INGESTION="$ROOT/nuvola-atlas-ingestion"
DATA="$ROOT/nuvola-atlas-data"

names=()
results=()
failed=0

# $1 name, $2 "blocking"|"informational", rest = command
run() {
  local name="$1" mode="$2"
  shift 2
  printf '\n\033[1m=== %s\033[0m\n' "$name"
  if "$@"; then
    names+=("$name")
    results+=("pass")
  elif [ "$mode" = "informational" ]; then
    names+=("$name")
    results+=("red")
  else
    names+=("$name")
    results+=("FAIL")
    failed=1
  fi
}

# Both Python services are installed with `pip install -e ".[dev]"`, which
# people do either into a project-local .venv (both .gitignore one) or into
# whatever interpreter is active. Prefer the project's own .venv so a check
# run does not depend on remembering to activate it; fall back to PATH.
# Missing tooling fails loudly with the install command rather than skipping,
# for the same reason the postgres probe below does: a check that quietly
# does nothing is worse than one that fails.
py_bin() {
  local project="$1" tool="$2"
  if [ -x "$project/.venv/bin/$tool" ]; then
    echo "$project/.venv/bin/$tool"
  elif command -v "$tool" > /dev/null 2>&1; then
    command -v "$tool"
  else
    return 1
  fi
}

py_checks() {
  local project="$1" label="$2"
  local ruff pytest
  if ! ruff=$(py_bin "$project" ruff) || ! pytest=$(py_bin "$project" pytest); then
    echo "ruff/pytest not found for $label."
    echo "install them with:  cd $(basename "$project") && python3 -m venv .venv && .venv/bin/pip install -e '.[dev]'"
    return 1
  fi
  (cd "$project" && "$ruff" check . && "$pytest" --no-header -ra)
}

ingestion_checks() { py_checks "$INGESTION" "nuvola-atlas-ingestion"; }
data_checks()      { py_checks "$DATA"      "nuvola-atlas-data"; }

backend_tests() {
  # phpunit.xml pins to 127.0.0.1:5434. Without a server there it does not
  # fail, it hangs on a TCP timeout — so check the port itself rather than
  # guessing which compose file someone started it from.
  if ! (exec 3<>/dev/tcp/127.0.0.1/5434) 2>/dev/null; then
    echo "nothing listening on 127.0.0.1:5434 — phpunit would hang, not fail."
    echo "start it with:  make db     (or: docker compose up -d postgres)"
    return 1
  fi
  cd "$BACKEND" && php vendor/phpunit/phpunit/phpunit --no-coverage
}

# Node major must match .nvmrc, which matches what CI installs. Warn rather
# than fail: an untested major might be fine, and blocking on it would be a
# guess. But say it up front, because the symptom is baffling otherwise — on
# Node 26 vitest 2.1.9's jsdom environment silently omits `localStorage`, so
# 14 tests die with "Cannot read properties of undefined (reading 'getItem')"
# pointing at application code that is not wrong.
if [ -f "$ROOT/.nvmrc" ] && command -v node > /dev/null 2>&1; then
  want=$(tr -d 'v \n' < "$ROOT/.nvmrc" | cut -d. -f1)
  have=$(node --version | tr -d 'v' | cut -d. -f1)
  if [ -n "$want" ] && [ "$want" != "$have" ]; then
    printf '\n\033[33mnode %s is active; .nvmrc and CI both pin %s.\033[0m\n' "$have" "$want"
    printf 'If the frontend tests fail on localStorage, this is why — run `nvm use` first.\n'
  fi
fi

run "pillar registry"      blocking      node "$ROOT/scripts/gen-pillars.mjs" --check
run "zone registry"        blocking      node "$ROOT/scripts/check-zones.mjs"
run "freedom-index purge"  blocking      bash "$ROOT/scripts/check-freedom-index.sh"
run "backend — phpunit"    blocking      backend_tests
run "backend — phpstan"    informational bash -c "cd '$BACKEND' && vendor/bin/phpstan analyse --memory-limit=512M --no-progress"
run "frontend — typecheck" blocking      bash -c "cd '$FRONTEND' && npm run typecheck"
run "frontend — vitest"    blocking      bash -c "cd '$FRONTEND' && npm test"
run "frontend — build"     blocking      bash -c "cd '$FRONTEND' && npm run build"
run "ingestion — ruff+pytest" blocking   ingestion_checks
run "data — ruff+pytest"   blocking      data_checks

printf '\n\033[1m=== summary\033[0m\n'
for i in "${!names[@]}"; do
  case "${results[$i]}" in
    pass) printf '  \033[32m%-5s\033[0m %s\n' "pass" "${names[$i]}" ;;
    red)  printf '  \033[33m%-5s\033[0m %s (informational — known pre-existing debt)\n' "red" "${names[$i]}" ;;
    *)    printf '  \033[31m%-5s\033[0m %s\n' "FAIL" "${names[$i]}" ;;
  esac
done

# phpstan matches CI: it runs and its result is printed, but it does not gate.
# It carries 154 pre-existing violations at level 5, and a check that is
# always red teaches everyone to stop reading it. The number is still shown
# so it cannot drift upward unnoticed.
echo
if [ "$failed" -ne 0 ]; then
  echo "one or more blocking checks failed"
else
  echo "blocking checks green"
fi
exit "$failed"
