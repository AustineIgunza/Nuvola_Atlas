<?php

declare(strict_types=1);

namespace App\Services\Agents\Tools;

use App\Models\Firm;
use App\Models\User;
use App\Services\Agents\BaseAgentTool;
use App\Services\Watchlist\WatchlistService;

/**
 * Firm-scoped tool — only useful when the agent runtime has an authed
 * investor user in context. If the caller has no primary firm, the tool
 * returns an explanatory error rather than an empty result so the LLM
 * can surface the reason cleanly to the user.
 */
class WatchlistOpportunitiesTool extends BaseAgentTool
{
    public function __construct(private WatchlistService $service) {}

    public function name(): string
    {
        return 'watchlist_opportunities';
    }

    public function description(): string
    {
        return "Return the caller's firm watchlist AND the top ranked non-watchlisted opportunities weighted by firm tier. Only works for investor accounts with an assigned firm.";
    }

    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 20, 'default' => 5],
            ],
        ];
    }

    public function execute(array $args): array
    {
        $userId = (int) ($args['_user_id'] ?? 0);
        if ($userId === 0) {
            return ['error' => 'watchlist_opportunities requires an authenticated user.'];
        }

        $user = User::find($userId);
        if (! $user || $user->primary_firm_id === null) {
            return ['error' => 'This tool needs an investor account with an assigned firm.'];
        }

        $firm = Firm::find($user->primary_firm_id);
        if (! $firm) {
            return ['error' => 'Firm not found.'];
        }

        $limit = min(20, max(1, (int) ($args['limit'] ?? 5)));
        $watchlist = $this->service->forFirm($firm)->map(fn ($e) => [
            'zone_id' => $e->zone_id,
            'zone_name' => $e->zone?->name,
            'priority' => $e->priority,
            'score' => $e->zone?->score,
            'thesis' => $e->thesis,
        ])->all();

        return [
            'firm' => [
                'name' => $firm->name,
                'tier' => $firm->tier->value,
            ],
            'watchlist' => $watchlist,
            'opportunities' => $this->service->opportunities($firm, $limit),
        ];
    }
}
