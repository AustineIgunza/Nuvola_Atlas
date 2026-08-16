<?php

declare(strict_types=1);

namespace App\Services\Agents\Tools;

use App\Services\Agents\BaseAgentTool;
use App\Services\Feeds\FeedStatusService;

class FeedStatusTool extends BaseAgentTool
{
    public function __construct(private FeedStatusService $service) {}

    public function name(): string
    {
        return 'feed_status';
    }

    // Mirrors the gate on GET /api/v1/admin/feeds, which this tool wraps.
    public function ability(): ?string
    {
        return 'view-feed-status';
    }

    public function description(): string
    {
        return 'Return data feed freshness across every indicator — how many feeds are fresh / stale / overdue / missing right now, plus a per-feed list. Use for "which data is stale?", "how fresh is X?", "when did KPLC last deliver?".';
    }

    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'state' => ['type' => 'string', 'enum' => ['fresh', 'stale', 'overdue', 'missing'], 'description' => 'Filter to feeds in this state.'],
                'zone_id' => ['type' => 'string', 'description' => 'Filter to a single zone.'],
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 50, 'default' => 20],
            ],
        ];
    }

    public function execute(array $args): array
    {
        $matrix = $this->service->matrix();
        $feeds = $matrix['feeds'];

        if (isset($args['state'])) {
            $feeds = array_values(array_filter($feeds, fn ($f) => $f['state'] === $args['state']));
        }
        if (isset($args['zone_id'])) {
            $feeds = array_values(array_filter($feeds, fn ($f) => $f['zone_id'] === $args['zone_id']));
        }
        $limit = min(50, max(1, (int) ($args['limit'] ?? 20)));

        return [
            'summary' => $matrix['summary'],
            'feeds' => array_slice($feeds, 0, $limit),
        ];
    }
}
