<?php

declare(strict_types=1);

namespace App\Services\Export;

use App\Models\Alert;
use App\Models\Project;
use App\Models\Zone;
use App\Services\PillarDeltaCalculator;
use App\Services\ScoreCalculator;
use App\Support\Pillars;
use Dompdf\Dompdf;
use Dompdf\Options as DompdfOptions;
use InvalidArgumentException;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;

/**
 * Generates a compact zone report in TXT / PDF / DOCX from the same
 * underlying zone snapshot. One source of truth so the three formats
 * stay in sync — no HTML template drift.
 */
class ZoneReportExporter
{
    private const FORMATS = ['txt', 'pdf', 'docx'];

    /**
     * @return array{format: string, mime: string, filename: string, body: string}
     */
    public function export(Zone $zone, string $format): array
    {
        $format = strtolower($format);
        if (! in_array($format, self::FORMATS, true)) {
            throw new InvalidArgumentException("Unknown export format: {$format}");
        }

        $data = $this->collect($zone);

        return match ($format) {
            'txt' => [
                'format' => 'txt',
                'mime' => 'text/plain',
                'filename' => "{$zone->id}-vitality-report.txt",
                'body' => $this->buildText($data),
            ],
            'pdf' => [
                'format' => 'pdf',
                'mime' => 'application/pdf',
                'filename' => "{$zone->id}-vitality-report.pdf",
                'body' => $this->buildPdf($data),
            ],
            'docx' => [
                'format' => 'docx',
                'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'filename' => "{$zone->id}-vitality-report.docx",
                'body' => $this->buildDocx($data),
            ],
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function collect(Zone $zone): array
    {
        $projects = Project::where('zone_id', $zone->id)->get();
        $alerts = Alert::where('zone_id', $zone->id)->get();

        $calc = new ScoreCalculator;
        // The deltas used to be hardcoded to zero here, which printed "+0" for
        // every pillar of every zone — a movement claim with no history behind
        // it. They now come from the same snapshot diff the API uses, and read
        // "—" when the window has nothing to compare against.
        $delta = (new PillarDeltaCalculator)->forZones([$zone])[$zone->id]
            ?? PillarDeltaCalculator::unknown();

        return [
            'zone' => $zone,
            'projects' => $projects,
            'alerts' => $alerts,
            'pillars' => $calc->pillarScores($zone),
            'deltas' => $delta['deltas'],
            'deltaWindowDays' => $delta['windowDays'],
            'generatedAt' => now()->toRfc7231String(),
        ];
    }

    private function buildText(array $data): string
    {
        $z = $data['zone'];
        $rows = $this->pillarRows($data);
        $width = max(array_map(fn (array $r) => strlen($r[0]), $rows)) + 2;

        $lines = [
            'NAVUUNA ATLAS — Zone Vitality Report',
            "Zone: {$z->name}",
            'Vitality Score: '.($z->score === null ? 'insufficient data' : "{$z->score}/100"),
            '',
            'Pillar Scores:',
        ];
        foreach ($rows as [$label, $value, $_]) {
            $lines[] = '  '.str_pad($label.':', $width).$this->fmtScore($value);
        }

        $lines[] = '';
        $lines[] = $this->deltaHeading($data);
        foreach ($rows as [$label, $_, $delta]) {
            $lines[] = '  '.str_pad($label.':', $width).$this->signed($delta);
        }

        $lines[] = '';
        $lines[] = 'Infrastructure projects: '.count($data['projects']);

        foreach ($data['projects'] as $p) {
            $lines[] = "  - [{$p->status}] {$p->name} ({$p->progress}%) — {$p->agency}";
        }

        $lines[] = '';
        $lines[] = 'Active alerts: '.count($data['alerts']);
        foreach ($data['alerts'] as $a) {
            $lines[] = "  - [{$a->severity}] {$a->title}";
        }

        $lines[] = '';
        $lines[] = "Generated: {$data['generatedAt']}";

        return implode("\n", $lines);
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
        $z = $data['zone'];
        $projects = $data['projects'];
        $alerts = $data['alerts'];
        $g = htmlspecialchars((string) $data['generatedAt']);
        // One source for the index label so a rebrand lands in every export
        // format at once — see config/branding.php.
        $indexName = htmlspecialchars((string) config('branding.index_name_short'));

        $pillarRows = '';
        foreach ($this->pillarRows($data) as [$label, $value, $delta]) {
            $pillarRows .= sprintf(
                '<tr><td width="60%%">%s</td><td><strong>%s</strong></td><td>%s</td></tr>',
                htmlspecialchars($label),
                $this->fmtScore($value),
                $this->signed($delta),
            );
        }
        $deltaHeading = htmlspecialchars($this->deltaHeading($data));

        $scoreBlock = $z->score === null
            ? '<span style="font-size:18pt;color:#6B6257">Insufficient data</span>'
            : "{$z->score}<span style=\"font-size:14pt;color:#6B6257\">&nbsp;/100</span>";

        $projectRows = '';
        foreach ($projects as $p) {
            $projectRows .= sprintf(
                '<tr><td>%s</td><td>%s</td><td>%s</td><td>%d%%</td></tr>',
                htmlspecialchars((string) $p->status),
                htmlspecialchars((string) $p->name),
                htmlspecialchars((string) $p->agency),
                (int) $p->progress,
            );
        }
        if ($projectRows === '') {
            $projectRows = '<tr><td colspan="4">None tracked.</td></tr>';
        }

        $alertRows = '';
        foreach ($alerts as $a) {
            $alertRows .= sprintf(
                '<tr><td>%s</td><td>%s</td></tr>',
                htmlspecialchars((string) $a->severity),
                htmlspecialchars((string) $a->title),
            );
        }
        if ($alertRows === '') {
            $alertRows = '<tr><td colspan="2">None active.</td></tr>';
        }

        return <<<HTML
<!doctype html>
<html>
<head><meta charset="utf-8">
<style>
  body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 11pt; }
  h1 { color: #0B2235; margin: 0 0 4px; }
  .kicker { color: #6B6257; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; }
  .score { font-size: 42pt; font-weight: 700; color: #1F8A78; }
  .subtitle { color: #6B6257; font-size: 10pt; }
  h2 { color: #0B2235; margin-top: 20px; font-size: 12pt; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
  .pillars { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .pillars td { padding: 4px 6px; font-size: 10pt; }
  table.data { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9pt; }
  table.data th, table.data td { padding: 4px 6px; text-align: left; border-bottom: 1px solid #eee; }
  table.data th { background: #f6f4ef; color: #6B6257; font-weight: 600; text-transform: uppercase; font-size: 8pt; letter-spacing: 0.5px; }
  .footer { margin-top: 26px; font-size: 8pt; color: #6B6257; }
</style>
</head>
<body>
  <div class="kicker">Navuuna Atlas · Sub-county Vitality Report</div>
  <h1>{$z->name}</h1>
  <div class="subtitle">{$indexName} — snapshot</div>

  <div class="score">{$scoreBlock}</div>

  <h2>Pillar Scores</h2>
  <div style="font-size:8pt;color:#6B6257">{$deltaHeading}</div>
  <table class="pillars">{$pillarRows}</table>

  <h2>Infrastructure Projects</h2>
  <table class="data">
    <thead><tr><th>Status</th><th>Project</th><th>Agency</th><th>Progress</th></tr></thead>
    <tbody>{$projectRows}</tbody>
  </table>

  <h2>Active Alerts</h2>
  <table class="data">
    <thead><tr><th>Severity</th><th>Title</th></tr></thead>
    <tbody>{$alertRows}</tbody>
  </table>

  <div class="footer">Generated {$g} · Each pillar is one measured figure with its source and vintage published on the Methodology page. A pillar with no reading shows "—" and is excluded from the composite, never counted as zero.</div>
</body>
</html>
HTML;
    }

    private function buildDocx(array $data): string
    {
        $z = $data['zone'];
        $phpWord = new PhpWord;
        $section = $phpWord->addSection();

        $section->addText('Navuuna Atlas · Sub-county Vitality Report', ['size' => 8, 'color' => '6B6257']);
        $section->addTitle($z->name, 1);
        $section->addText(config('branding.index_name_short').' — snapshot', ['size' => 10, 'color' => '6B6257']);

        $section->addTextBreak(1);
        $section->addText(
            $z->score === null ? 'Insufficient data' : "{$z->score}/100",
            ['size' => $z->score === null ? 18 : 32, 'bold' => true, 'color' => $z->score === null ? '6B6257' : '1F8A78'],
            ['alignment' => Jc::START]
        );

        $section->addTextBreak(1);
        $section->addTitle('Pillar Scores', 2);
        $section->addText($this->deltaHeading($data), ['size' => 8, 'color' => '6B6257']);
        $table = $section->addTable(['borderSize' => 4, 'borderColor' => 'DDDDDD', 'cellMargin' => 80]);
        foreach ($this->pillarRows($data) as [$label, $val, $delta]) {
            $table->addRow();
            $table->addCell(6000)->addText($label);
            $table->addCell(1200)->addText($this->fmtScore($val), ['bold' => true]);
            $table->addCell(1200)->addText($this->signed($delta));
        }

        $section->addTextBreak(1);
        $section->addTitle('Infrastructure Projects', 2);
        if (count($data['projects']) === 0) {
            $section->addText('None tracked.', ['color' => '6B6257', 'italic' => true]);
        } else {
            foreach ($data['projects'] as $p) {
                $section->addListItem("[{$p->status}] {$p->name} — {$p->agency} ({$p->progress}%)");
            }
        }

        $section->addTextBreak(1);
        $section->addTitle('Active Alerts', 2);
        if (count($data['alerts']) === 0) {
            $section->addText('None active.', ['color' => '6B6257', 'italic' => true]);
        } else {
            foreach ($data['alerts'] as $a) {
                $section->addListItem("[{$a->severity}] {$a->title}");
            }
        }

        $section->addTextBreak(2);
        $section->addText("Generated {$data['generatedAt']}", ['size' => 8, 'color' => '6B6257']);

        $writer = IOFactory::createWriter($phpWord, 'Word2007');
        ob_start();
        $writer->save('php://output');

        return (string) ob_get_clean();
    }

    /**
     * Null means the history could not support a direction claim, which is
     * not the same as "did not move" — so it prints "—", not "+0".
     */
    private function signed(?int $n): string
    {
        if ($n === null) {
            return '—';
        }

        return $n > 0 ? "+{$n}" : (string) $n;
    }

    /**
     * Render a pillar score for the report. Null means the pillar has no
     * reading yet — shown as "—" so the report doesn't lie with a "0".
     */
    private function fmtScore(?int $n): string
    {
        return $n === null ? '—' : (string) $n;
    }

    /**
     * Pillar rows in registry order: [display name, score, delta].
     *
     * @param  array<string, mixed>  $data
     * @return array<int, array{0: string, 1: ?int, 2: ?int}>
     */
    private function pillarRows(array $data): array
    {
        return array_map(
            fn (array $pillar) => [
                $pillar['display_name'],
                $data['pillars'][$pillar['key']] ?? null,
                $data['deltas'][$pillar['key']] ?? null,
            ],
            Pillars::all(),
        );
    }

    /**
     * "quarter-over-quarter" was a fixed claim about a window the report never
     * measured. The window is whatever the baseline snapshot's real age is.
     */
    private function deltaHeading(array $data): string
    {
        $days = $data['deltaWindowDays'] ?? null;

        return $days === null
            ? 'Movement (no comparable history yet):'
            : "Movement (last {$days} days):";
    }
}
