<?php

declare(strict_types=1);

namespace App\Services\Export;

use App\Models\Firm;
use App\Services\ScoreCalculator;
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
        $options = new DompdfOptions();
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
        /** @var \App\Models\Firm $firm */
        $firm = $data['firm'];
        $watchlists = $data['watchlists'];
        $g = htmlspecialchars((string) $data['generatedAt']);
        $calc = new ScoreCalculator();

        $tier = htmlspecialchars(strtoupper($firm->tier->value));
        $firmName = htmlspecialchars($firm->name);

        $rows = '';
        foreach ($watchlists as $entry) {
            $zone = $entry->zone;
            if (! $zone) {
                continue;
            }
            $pillars = $calc->pillarScores($zone);
            $thesis = $entry->thesis ? htmlspecialchars($entry->thesis) : '<em style="color:#6B6257">No thesis recorded.</em>';
            $rows .= <<<HTML
            <tr>
              <td style="padding:8px 6px;border-bottom:1px solid #eee">
                <div style="font-weight:600;color:#0B2235">{$zone->name}</div>
                <div style="font-size:8pt;color:#6B6257">Priority {$entry->priority}</div>
              </td>
              <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right">
                <div style="font-size:20pt;font-weight:700;color:#1F8A78">{$zone->score}</div>
                <div style="font-size:8pt;color:#6B6257">/100</div>
              </td>
              <td style="padding:8px 6px;border-bottom:1px solid #eee;font-size:8pt">
                Social {$this->fmt($pillars['social'])} · Safety {$this->fmt($pillars['safety'])} ·
                Density {$this->fmt($pillars['density'])} · Infra {$this->fmt($pillars['infra'])}
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
    The Vitality Score is computed as the simple average of four equally-weighted
    pillars (Social Wellbeing &amp; Human Capital, Safety &amp; Security, Density
    &amp; Scaling Dynamics, Infrastructure &amp; Environmental Safeguards).
    Missing indicators are excluded from the average — they are never treated as
    zero, so a locality with limited data reporting is not penalised for it.
    See the Vitality Methodology page in Navuuna Atlas for the full 13-indicator
    breakdown and the current published methodology version.
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
}
