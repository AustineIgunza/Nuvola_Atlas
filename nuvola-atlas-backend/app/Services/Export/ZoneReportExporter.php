<?php

declare(strict_types=1);

namespace App\Services\Export;

use App\Models\Alert;
use App\Models\Project;
use App\Models\Zone;
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

        return [
            'zone' => $zone,
            'projects' => $projects,
            'alerts' => $alerts,
            'generatedAt' => now()->toRfc7231String(),
        ];
    }

    private function buildText(array $data): string
    {
        $z = $data['zone'];
        $lines = [
            'NAVUUNA ATLAS — Zone Vitality Report',
            "Zone: {$z->name}",
            "Vitality Score: {$z->score}/100",
            '',
            'Pillar Scores:',
            "  Social Wellbeing:    {$z->pillar_social}",
            "  Safety & Security:   {$z->pillar_safety}",
            "  Density & Scaling:   {$z->pillar_density}",
            "  Infrastructure/Env:  {$z->pillar_infra}",
            '',
            'Deltas (quarter-over-quarter):',
            "  Social:   " . $this->signed($z->delta_social),
            "  Safety:   " . $this->signed($z->delta_safety),
            "  Density:  " . $this->signed($z->delta_density),
            "  Infra:    " . $this->signed($z->delta_infra),
            '',
            'Infrastructure projects: ' . count($data['projects']),
        ];

        foreach ($data['projects'] as $p) {
            $lines[] = "  - [{$p->status}] {$p->name} ({$p->progress}%) — {$p->agency}";
        }

        $lines[] = '';
        $lines[] = 'Active alerts: ' . count($data['alerts']);
        foreach ($data['alerts'] as $a) {
            $lines[] = "  - [{$a->severity}] {$a->title}";
        }

        $lines[] = '';
        $lines[] = "Generated: {$data['generatedAt']}";
        return implode("\n", $lines);
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
        $z = $data['zone'];
        $projects = $data['projects'];
        $alerts = $data['alerts'];
        $g = htmlspecialchars((string) $data['generatedAt']);

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
        if ($projectRows === '') $projectRows = '<tr><td colspan="4">None tracked.</td></tr>';

        $alertRows = '';
        foreach ($alerts as $a) {
            $alertRows .= sprintf(
                '<tr><td>%s</td><td>%s</td></tr>',
                htmlspecialchars((string) $a->severity),
                htmlspecialchars((string) $a->title),
            );
        }
        if ($alertRows === '') $alertRows = '<tr><td colspan="2">None active.</td></tr>';

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
  <div class="subtitle">UE Vitality Index — snapshot</div>

  <div class="score">{$z->score}<span style="font-size:14pt;color:#6B6257">&nbsp;/100</span></div>

  <h2>Pillar Scores</h2>
  <table class="pillars">
    <tr><td width="60%">Social Wellbeing &amp; Human Capital</td><td><strong>{$z->pillar_social}</strong></td><td>{$this->signed($z->delta_social)}</td></tr>
    <tr><td>Safety &amp; Security</td><td><strong>{$z->pillar_safety}</strong></td><td>{$this->signed($z->delta_safety)}</td></tr>
    <tr><td>Density &amp; Scaling Dynamics</td><td><strong>{$z->pillar_density}</strong></td><td>{$this->signed($z->delta_density)}</td></tr>
    <tr><td>Infrastructure &amp; Environmental Safeguards</td><td><strong>{$z->pillar_infra}</strong></td><td>{$this->signed($z->delta_infra)}</td></tr>
  </table>

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

  <div class="footer">Generated {$g} · Vitality Score methodology is validated against Navuuna's four-pillar framework. Score movement over 12+ months is available on the Compare page.</div>
</body>
</html>
HTML;
    }

    private function buildDocx(array $data): string
    {
        $z = $data['zone'];
        $phpWord = new PhpWord();
        $section = $phpWord->addSection();

        $section->addText('Navuuna Atlas · Sub-county Vitality Report', ['size' => 8, 'color' => '6B6257']);
        $section->addTitle($z->name, 1);
        $section->addText('UE Vitality Index — snapshot', ['size' => 10, 'color' => '6B6257']);

        $section->addTextBreak(1);
        $section->addText(
            "{$z->score}/100",
            ['size' => 32, 'bold' => true, 'color' => '1F8A78'],
            ['alignment' => Jc::START]
        );

        $section->addTextBreak(1);
        $section->addTitle('Pillar Scores', 2);
        $pillars = [
            ['Social Wellbeing & Human Capital', $z->pillar_social, $z->delta_social],
            ['Safety & Security', $z->pillar_safety, $z->delta_safety],
            ['Density & Scaling Dynamics', $z->pillar_density, $z->delta_density],
            ['Infrastructure & Environmental Safeguards', $z->pillar_infra, $z->delta_infra],
        ];
        $table = $section->addTable(['borderSize' => 4, 'borderColor' => 'DDDDDD', 'cellMargin' => 80]);
        foreach ($pillars as [$label, $val, $delta]) {
            $table->addRow();
            $table->addCell(6000)->addText($label);
            $table->addCell(1200)->addText((string) $val, ['bold' => true]);
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

    private function signed(int $n): string
    {
        if ($n > 0) return "+{$n}";
        return (string) $n;
    }
}
