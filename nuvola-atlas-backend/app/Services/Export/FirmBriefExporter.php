<?php

declare(strict_types=1);

namespace App\Services\Export;

use App\Domain\Scoring\ScoreCalculator;
use App\Models\Firm;
use App\Support\Pillars;
use Dompdf\Dompdf;
use Dompdf\Options as DompdfOptions;

/**
 * LP-style multi-zone brief for a firm's watchlist. Extends the visual
 * language of ZoneReportExporter (same fonts, palette, footer) but
 * fans out across every zone the firm tracks rather than reporting on
 * one.
 *
 * The intent is a document an LP can drop into a portfolio review deck
 * without reformatting — a cover, per-zone rows with pillar bars, plus
 * a methodology footer.
 */
class FirmBriefExporter
{
    public function export(Firm $firm): array
    {
        $firm->loadMissing(['watchlists.zone']);

        $data = [
            'firm' => $firm,
            'watchlists' => $firm->watchlists->sortBy('priority')->values(),
            'generatedAt' => now()->toRfc7231String(),
        ];

        $body = $this->buildPdf($data);

        return [
            'format' => 'pdf',
            'mime' => 'application/pdf',
            'filename' => "{$firm->slug}-navuuna-brief.pdf",
            'body' => $body,
        ];
    }

    private function buildPdf(array $data): string
    {
        $options = new DompdfOptions;
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'Helvetica');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($this->buildHtml($data));
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return (string) $dompdf->output();
    }

    private function buildHtml(array $data): string
    {
        /** @var Firm $firm */
        $firm = $data['firm'];
        $watchlists = $data['watchlists'];
        $g = htmlspecialchars((string) $data['generatedAt']);
        $calc = new ScoreCalculator;

        $tier = htmlspecialchars(strtoupper($firm->tier->value));
        $firmName = htmlspecialchars($firm->name);

        $weights = $calc->getWeights();
        $methodologyLine = htmlspecialchars(implode(', ', array_map(
            fn (array $p) => $p['display_name'].' '.($weights[$p['key']] ?? 0)
                .($p['status'] === 'held' ? ' (held — shown for context, carries no weight)' : ''),
            Pillars::all(),
        )));

        $rows = '';
        foreach ($watchlists as $entry) {
            $zone = $entry->zone;
            if (! $zone) {
                continue;
            }
            $pillars = $calc->pillarScores($zone);
            $thesis = $entry->thesis ? htmlspecialchars($entry->thesis) : '<em style="color:#6B6257">No thesis recorded.</em>';
            $headline = $zone->score === null
                ? '<div style="font-size:9pt;color:#6B6257">Insufficient data</div>'
                : "<div style=\"font-size:20pt;font-weight:700;color:#1F8A78\">{$zone->score}</div>"
                    .'<div style="font-size:8pt;color:#6B6257">/100</div>';
            $rows .= <<<HTML
            <tr>
              <td style="padding:8px 6px;border-bottom:1px solid #eee">
                <div style="font-weight:600;color:#0B2235">{$zone->name}</div>
                <div style="font-size:8pt;color:#6B6257">Priority {$entry->priority}</div>
              </td>
              <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right">
                {$headline}
              </td>
              <td style="padding:8px 6px;border-bottom:1px solid #eee;font-size:8pt">
                {$this->pillarSummary($pillars)}
              </td>
              <td style="padding:8px 6px;border-bottom:1px solid #eee;font-size:9pt;max-width:220px">
                {$thesis}
              </td>
            </tr>
HTML;
        }
        if ($rows === '') {
            $rows = '<tr><td colspan="4" style="padding:12px;color:#6B6257">No zones on watchlist.</td></tr>';
        }

        return <<<HTML
<!doctype html>
<html>
<head><meta charset="utf-8">
<style>
  body { font-family: Helvetica, Arial, sans-serif; color:#1a1a1a; font-size:11pt; }
  h1 { color:#0B2235; margin:0 0 6px; }
  .kicker { color:#6B6257; font-size:8pt; text-transform:uppercase; letter-spacing:1.2px; }
  .tier-chip { display:inline-block; padding:2px 8px; background:#0B2235; color:#fff; font-size:8pt; letter-spacing:1px; }
  h2 { color:#0B2235; margin-top:22px; font-size:12pt; border-bottom:1px solid #ddd; padding-bottom:3px; }
  table { width:100%; border-collapse:collapse; margin-top:8px; font-size:9pt; }
  .footer { margin-top:26px; font-size:8pt; color:#6B6257; }
</style>
</head>
<body>
  <div class="kicker">Navuuna Atlas · Portfolio Brief</div>
  <h1>{$firmName}</h1>
  <div><span class="tier-chip">{$tier} TIER</span></div>

  <h2>Watchlist</h2>
  <table>
    <thead>
      <tr style="background:#f6f4ef;color:#6B6257;text-transform:uppercase;font-size:8pt;letter-spacing:0.5px">
        <th style="text-align:left;padding:6px">Zone</th>
        <th style="text-align:right;padding:6px">Vitality</th>
        <th style="text-align:left;padding:6px">Pillars</th>
        <th style="text-align:left;padding:6px">Thesis</th>
      </tr>
    </thead>
    <tbody>{$rows}</tbody>
  </table>

  <h2>Methodology</h2>
  <p style="font-size:9pt;color:#333;line-height:1.4">
    The Vitality Score is the weighted mean of the pillars that have a reading,
    with the weights renormalized across exactly those pillars:
    {$methodologyLine}.
    A pillar with no reading is excluded from the average — never treated as
    zero — so a sub-county with limited reporting is not penalised for it.
    See the Vitality Methodology page in Navuuna Atlas for each pillar's source
    and vintage, and for the current published methodology version.
  </p>

  <div class="footer">
    Generated {$g} · Navuuna Atlas · This brief is scoped to {$firmName} and
    must not be redistributed without written consent.
  </div>
</body>
</html>
HTML;
    }

    private function fmt(?int $n): string
    {
        return $n === null ? '—' : (string) $n;
    }

    /**
     * @param  array<string, ?int>  $pillars
     */
    private function pillarSummary(array $pillars): string
    {
        return htmlspecialchars(implode(' · ', array_map(
            fn (array $p) => $p['display_name'].' '.$this->fmt($pillars[$p['key']] ?? null),
            Pillars::all(),
        )));
    }
}
