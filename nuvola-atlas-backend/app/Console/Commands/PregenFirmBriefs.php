<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Firm;
use App\Services\Export\FirmBriefExporter;
use App\Support\Audit;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Weekly warm-cache job — pre-generate the LP-style brief PDF for every
 * active firm and stash under storage/app/briefs/<slug>-<yyyy-mm-dd>.pdf
 * so /investor/brief can hit-cache instead of re-rendering every hit.
 *
 * Cheap for a pilot's ~3-firm fleet; when the firm count grows this
 * becomes the seed for a proper cache layer (R2 object storage) that
 * the /investor/brief controller falls back to.
 */
class PregenFirmBriefs extends Command
{
    protected $signature = 'nuvola:pregen-firm-briefs {--only= : Comma-separated firm slugs}';
    protected $description = 'Pre-generate LP-style firm briefs and cache under storage/app/briefs/.';

    public function __construct(private FirmBriefExporter $exporter)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $only = collect(explode(',', (string) $this->option('only')))
            ->map(fn ($s) => trim($s))
            ->filter()
            ->all();

        $query = Firm::query()->where('active', true);
        if (! empty($only)) {
            $query->whereIn('slug', $only);
        }
        $firms = $query->get();

        $stamp = now()->format('Y-m-d');
        $generated = 0;
        foreach ($firms as $firm) {
            $result = $this->exporter->export($firm);
            $path = "briefs/{$firm->slug}-{$stamp}.pdf";
            Storage::disk('local')->put($path, $result['body']);
            $generated++;
            Audit::record('cron.pregen_brief', $firm, null, ['path' => $path]);
        }

        $this->info("Pre-generated {$generated} firm brief(s) for {$stamp}.");
        return self::SUCCESS;
    }
}
