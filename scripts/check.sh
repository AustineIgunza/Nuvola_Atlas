#!/usr/bin/env bash
#
# The five checks, in one place. The Makefile calls this; so can anyone
# without `make`, which includes every Windows machine on the team:
#
#   bash scripts/check.sh
#
# Runs all five even when an early one fails, so a single run tells you
# everything that is broken rather than only the first thing.

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
ROOT="$PWD"

BACKEND="$ROOT/nuvola-atlas-backend"
FRONTEND="$ROOT/nuvola-atlas-frontend"

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

run "pillar registry"      blocking      node "$ROOT/scripts/gen-pillars.mjs" --check
run "backend — phpunit"    blocking      backend_tests
run "backend — phpstan"    informational bash -c "cd '$BACKEND' && vendor/bin/phpstan analyse --memory-limit=512M --no-progress"
run "frontend — typecheck" blocking      bash -c "cd '$FRONTEND' && npm run typecheck"
run "frontend — vitest"    blocking      bash -c "cd '$FRONTEND' && npm test"
run "frontend — build"     blocking      bash -c "cd '$FRONTEND' && npm run build"

printf '\n\033[1m=== summary\033[0m\n'
for i in "${!names[@]}"; do
  case "${results[$i]}" in
    pass) printf '  \033[32m%-5s\033[0m %s\n' "pass" "${names[$i]}" ;;
    red)  printf '  \033[33m%-5s\033[0m %s (informational — known pre-existing debt)\n' "red" "${names[$i]}" ;;
    *)    printf '  \033[31m%-5s\033[0m %s\n' "FAIL" "${names[$i]}" ;;
  esac
done

# phpstan matches CI: it runs and its result is printed, but it does not gate.
# It carries 158 pre-existing violations at level 5, and a check that is
# always red teaches everyone to stop reading it. The number is still shown
# so it cannot drift upward unnoticed.
echo
if [ "$failed" -ne 0 ]; then
  echo "one or more blocking checks failed"
else
  echo "blocking checks green"
fi
exit "$failed"
