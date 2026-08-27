#!/usr/bin/env bash
#
# Fail the build if "Freedom Index" (or a case/spacing variant) reappears
# anywhere outside the historical directive that ordered its removal.
#
# Why:
#   Freedom House holds prior use of the "Freedom Index" name and Navuuna
#   cites their Internet Freedom Score as a source. Using it as a product
#   label creates trademark confusion risk and would be refused at KIPI.
#   The purge is P7.1 in NAVUUNA_PROMPTS_ROUND2.md — a blocking item on
#   the marketing plan. This script is the tripwire.
#
# Allowlist:
#   - NAVUUNA_PROMPTS_ROUND2.md — the directive itself; it MUST mention
#     the string to say what to purge, and it is the historical record of
#     why the purge happened.
#   - Nothing else. The retirement of the pillar was renamed to
#     `civic` (via `civic_index`); if you need to reference the historical
#     identifier, do so via `pillars.json`'s `retired.renamed_from` field,
#     not the string.

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

ALLOWLIST=(
  # The directive that ordered the purge and the strategy doc that recorded
  # what was retired and why. Historical.
  "NAVUUNA_PROMPTS_ROUND2.md"
  "NAVUUNA_REFOCUS_WORKFLOW.md"
  # The commit-by-commit change log. It records the rename that retired the
  # label, so it must name the old identifier to describe what happened —
  # same historical-record category as the two directives above. Added after
  # this allowlist was first written, which is why it went unlisted.
  "HISTORY.md"
  # The registry's retirement gravestone. renamed_from is the machine link
  # from civic back to the pre-purge identifier chain; a reader who greps
  # for the old key needs one match to find its successor.
  "pillars.json"
  # Negative-assertion test: it exercises the export path and proves the
  # banned string is NOT in the response body. Removing the label from the
  # list would silently disarm that check.
  "nuvola-atlas-backend/tests/Feature/ZoneExportApiTest.php"
  # The runner names this check by what it forbids.
  "scripts/check.sh"
  "scripts/check-freedom-index.sh"
  # Same reason, one step out: anything that invokes the script by filename
  # matches the pattern, because the filename contains it. These two list the
  # command a developer is meant to run, so they cannot avoid naming it.
  # Note this exempts the whole file, not just the command line — do not put
  # product copy in either of these and expect the guard to catch it.
  ".github/workflows/ci.yml"
  "CONTRIBUTING.md"
)

# Case-insensitive, matches: "Freedom Index", "FreedomIndex", "freedom_index",
# "freedom-index", "freedom.index" and any spacing/casing variant.
PATTERN='freedom[[:space:][:punct:]]*index'

# Which files, then filter allowlist. We limit to source-tracked files so a
# fresh clone with untracked scratch files doesn't fake a failure.
hits=$(git ls-files -z | \
  xargs -0 grep -EiIln "$PATTERN" 2>/dev/null || true)

if [ -z "$hits" ]; then
  echo "freedom-index check: clean"
  exit 0
fi

remaining=""
while IFS= read -r file; do
  [ -z "$file" ] && continue
  allowed=0
  for a in "${ALLOWLIST[@]}"; do
    if [ "$file" = "$a" ]; then
      allowed=1
      break
    fi
  done
  if [ "$allowed" -eq 0 ]; then
    remaining+="$file"$'\n'
  fi
done <<< "$hits"

if [ -z "$remaining" ]; then
  echo "freedom-index check: clean (all hits are in the historical allowlist)"
  exit 0
fi

echo "freedom-index check: FAIL"
echo
echo "The string 'Freedom Index' (or a spacing/casing variant) appears in:"
echo "$remaining" | sed 's/^/  /'
echo
echo "Why this matters: Freedom House holds prior use of the label and Navuuna"
echo "cites their Internet Freedom Score as a source. The pillar was renamed"
echo "to 'civic' (via 'civic_index') in P7.1 (see NAVUUNA_PROMPTS_ROUND2.md). If you need"
echo "the old identifier, use pillars.json's retired.renamed_from field."
exit 1
