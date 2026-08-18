<?php

declare(strict_types=1);

namespace App\Services\Agents\Providers;

use App\Services\Agents\AgentProvider;

/**
 * Zero-dependency router that keeps the agent surface functional
 * without any LLM key. Pattern-matches the user prompt against a small
 * ruleset that maps to the registered tools, then formats the tool
 * observation into a plain-English final answer.
 *
 * Perfectly usable for demos + local dev. Swap to a real LLM provider
 * (HuggingFaceAgentProvider) once the HF endpoint is live.
 */
class HeuristicAgentProvider implements AgentProvider
{
    private const ZONE_SLUGS = [
        'westlands', 'dagoretti-north', 'dagoretti-south', 'langata',
        'kibra', 'roysambu', 'kasarani', 'ruaraka',
        'embakasi-south', 'embakasi-north', 'embakasi-central', 'embakasi-east', 'embakasi-west',
        'makadara', 'kamukunji', 'starehe', 'mathare',
    ];

    public function nextStep(string $prompt, array $tools, array $history): array
    {
        // Step 1 — if we've already made a tool call, wrap up with a final answer.
        $lastObservation = $this->lastObservation($history);
        if ($lastObservation !== null) {
            return [
                'action' => 'final',
                'answer' => $this->formatFinal($prompt, $lastObservation),
                'reasoning' => 'heuristic: composing final answer from last observation',
            ];
        }

        $normalised = strtolower($prompt);
        $foundZones = $this->extractZones($normalised);

        // Rule: "compare X and Y" or "X vs Y"
        if (count($foundZones) >= 2 && preg_match('/(compare|vs\.?|versus|against|difference)/i', $prompt)) {
            return [
                'action' => 'tool_call',
                'tool' => 'compare_zones',
                'args' => ['zone_ids' => array_slice($foundZones, 0, 5)],
                'reasoning' => 'heuristic: multi-zone compare pattern',
            ];
        }

        // Rule: "how has X changed / trend / over time / last N days"
        if (count($foundZones) === 1 && preg_match('/(trend|history|over time|changed|improving|dropping|last \d+ days?)/i', $prompt)) {
            $days = 30;
            if (preg_match('/last (\d+) days?/i', $prompt, $m)) {
                $days = min(365, max(7, (int) $m[1]));
            }

            return [
                'action' => 'tool_call',
                'tool' => 'zone_history',
                'args' => ['zone_id' => $foundZones[0], 'days' => $days],
                'reasoning' => 'heuristic: single-zone trend pattern',
            ];
        }

        // Rule: single zone question
        if (count($foundZones) === 1) {
            return [
                'action' => 'tool_call',
                'tool' => 'get_zone',
                'args' => ['zone_id' => $foundZones[0]],
                'reasoning' => 'heuristic: single-zone snapshot pattern',
            ];
        }

        // Rule: leaderboard / "top / bottom / above / below"
        if (preg_match('/(top|highest|leaderboard|best)/i', $prompt)) {
            return [
                'action' => 'tool_call',
                'tool' => 'list_zones',
                'args' => ['order' => 'desc', 'limit' => 10],
                'reasoning' => 'heuristic: leaderboard desc',
            ];
        }
        if (preg_match('/(bottom|lowest|worst|struggling)/i', $prompt)) {
            return [
                'action' => 'tool_call',
                'tool' => 'list_zones',
                'args' => ['order' => 'asc', 'limit' => 10],
                'reasoning' => 'heuristic: leaderboard asc',
            ];
        }

        // Rule: methodology-style questions
        if (preg_match('/(methodology|how (does|do)|how is|what goes into|weight|pillar|indicator|formula|calculated)/i', $prompt)) {
            return [
                'action' => 'tool_call',
                'tool' => 'methodology',
                'args' => [],
                'reasoning' => 'heuristic: methodology pattern',
            ];
        }

        // Rule: feed status
        if (preg_match('/(stale|fresh|feed|data.{0,10}(quality|source|updated|delivery)|missing data|overdue)/i', $prompt)) {
            $args = ['limit' => 20];
            foreach (['fresh', 'stale', 'overdue', 'missing'] as $state) {
                if (str_contains($normalised, $state)) {
                    $args['state'] = $state;
                    break;
                }
            }

            return [
                'action' => 'tool_call',
                'tool' => 'feed_status',
                'args' => $args,
                'reasoning' => 'heuristic: feed-status pattern',
            ];
        }

        // Rule: investor watchlist / opportunities
        if (preg_match('/(watchlist|opportunity|opportunities|portfolio|fit|invest)/i', $prompt)) {
            return [
                'action' => 'tool_call',
                'tool' => 'watchlist_opportunities',
                'args' => ['limit' => 5],
                'reasoning' => 'heuristic: investor watchlist pattern',
            ];
        }

        // Fallback: leaderboard so the user still gets useful data.
        return [
            'action' => 'tool_call',
            'tool' => 'list_zones',
            'args' => ['order' => 'desc', 'limit' => 10],
            'reasoning' => 'heuristic: fallback leaderboard',
        ];
    }

    /** @return list<string> */
    private function extractZones(string $normalised): array
    {
        $found = [];
        foreach (self::ZONE_SLUGS as $slug) {
            $needle = str_replace('-', ' ', $slug);
            if (str_contains($normalised, $slug) || str_contains($normalised, $needle)) {
                $found[] = $slug;
            }
        }

        return array_values(array_unique($found));
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $history
     */
    private function lastObservation(array $history): ?array
    {
        for ($i = count($history) - 1; $i >= 0; $i--) {
            if (($history[$i]['role'] ?? '') === 'tool') {
                $decoded = json_decode($history[$i]['content'] ?? '', true);
                if (! is_array($decoded)) {
                    continue;
                }
                // AgentRuntime wraps every tool turn as {tool, observation}
                // so unwrap that here to expose the raw payload the
                // format switch below expects.
                if (isset($decoded['observation']) && is_array($decoded['observation'])) {
                    return $decoded['observation'];
                }

                return $decoded;
            }
        }

        return null;
    }

    /**
     * A zone with no indicators has no composite. Interpolating the null
     * left "composite /100" on screen; the pillars beside it already use
     * "—" for the same condition, so say it in words instead.
     */
    private function composite(mixed $score): string
    {
        return $score === null ? 'no score yet' : "{$score}/100";
    }

    private function formatFinal(string $prompt, array $obs): string
    {
        // compare_zones
        if (isset($obs['zones']) && isset($obs['winners'])) {
            $lines = ['Comparing the requested zones:'];
            foreach ($obs['zones'] as $z) {
                if (isset($z['error'])) {
                    $lines[] = "- {$z['zone_id']}: not found";

                    continue;
                }
                $name = $z['name'] ?? $z['zone_id'];
                $lines[] = "- **{$name}**: composite {$this->composite($z['score'])} · "
                    .'social '.($z['pillars']['social'] ?? '—')
                    .' · safety '.($z['pillars']['safety'] ?? '—')
                    .' · density '.($z['pillars']['density'] ?? '—')
                    .' · infra '.($z['pillars']['infra'] ?? '—');
            }
            if ($obs['winners']['overall']) {
                $lines[] = "Highest overall: **{$obs['winners']['overall']['zone_id']}** at {$obs['winners']['overall']['value']}.";
            }

            return implode("\n", $lines);
        }

        // zone_history
        if (isset($obs['series']) && isset($obs['direction'])) {
            if (empty($obs['series'])) {
                return "No score history is available for {$obs['zone_id']} yet — the snapshot table is empty for the requested window.";
            }
            $delta = $obs['delta'] > 0 ? "+{$obs['delta']}" : (string) $obs['delta'];

            return "Over the last {$obs['days']} days, **{$obs['zone_id']}** moved {$delta} points ({$obs['direction']}). "
                .count($obs['series']).' daily snapshots.';
        }

        // get_zone
        if (isset($obs['pillars']) && isset($obs['name'])) {
            $active = $obs['indicators_active'];
            $total = $obs['indicators_total'];
            $lines = [
                "**{$obs['name']}** ({$obs['zone_id']}) — Vitality Score **{$this->composite($obs['score'])}**.",
                'Pillars: social '.($obs['pillars']['social'] ?? '—')
                    .' · safety '.($obs['pillars']['safety'] ?? '—')
                    .' · density '.($obs['pillars']['density'] ?? '—')
                    .' · infra '.($obs['pillars']['infra'] ?? '—').'.',
                "{$active} of {$total} indicators active".(empty($obs['missing_indicators']) ? '.' : ' (missing: '.implode(', ', $obs['missing_indicators']).').'),
            ];

            return implode("\n", $lines);
        }

        // list_zones
        if (isset($obs['zones']) && isset($obs['count'])) {
            $lines = ["Top {$obs['count']} zones by composite score:"];
            foreach ($obs['zones'] as $i => $z) {
                $lines[] = ($i + 1).". **{$z['name']}** ({$z['zone_id']}) — {$this->composite($z['score'])}";
            }

            return implode("\n", $lines);
        }

        // methodology
        if (isset($obs['weights']) && isset($obs['pillars'])) {
            $lines = ["**Vitality methodology (v{$obs['version']})** — four equally-weighted pillars, 13 indicators, null-exclusion averaging."];
            foreach ($obs['pillars'] as $key => $indicators) {
                $lines[] = "- **{$key}**: ".implode(', ', $indicators);
            }
            $lines[] = 'Notes: '.implode(' ', $obs['notes'] ?? []);

            return implode("\n", $lines);
        }

        // feed_status
        if (isset($obs['summary']) && isset($obs['feeds'])) {
            $s = $obs['summary'];
            $lines = ["Feed freshness: {$s['fresh']} fresh · {$s['stale']} stale · {$s['overdue']} overdue · {$s['missing']} missing (of {$s['total']} tracked)."];
            if (! empty($obs['feeds'])) {
                $lines[] = 'Latest feeds:';
                foreach (array_slice($obs['feeds'], 0, 5) as $f) {
                    $age = $f['age_min'] === null ? 'never delivered' : "{$f['age_min']} min ago";
                    $lines[] = "- [{$f['state']}] {$f['zone_id']}/{$f['indicator_key']} · {$f['source_system']} · {$age}";
                }
            }

            return implode("\n", $lines);
        }

        // watchlist_opportunities
        if (isset($obs['watchlist']) || isset($obs['opportunities'])) {
            if (isset($obs['error'])) {
                return $obs['error'];
            }
            $lines = ["**{$obs['firm']['name']}** ({$obs['firm']['tier']} tier)"];
            if (! empty($obs['watchlist'])) {
                $lines[] = "\nWatchlist:";
                foreach ($obs['watchlist'] as $w) {
                    $lines[] = "- {$w['zone_name']} · {$this->composite($w['score'])} · priority {$w['priority']}";
                }
            }
            if (! empty($obs['opportunities'])) {
                $lines[] = "\nTop opportunities (weighted by tier):";
                foreach ($obs['opportunities'] as $o) {
                    $lines[] = "- {$o['zone_name']} · fit {$o['fit']} · {$this->composite($o['score'])}";
                }
            }

            return implode("\n", $lines);
        }

        // Generic — fall back to JSON so the user still sees the data.
        if (isset($obs['error'])) {
            return $obs['error'];
        }

        return 'Result: '.json_encode($obs, JSON_UNESCAPED_SLASHES);
    }
}
