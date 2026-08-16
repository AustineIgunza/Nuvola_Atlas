<?php

declare(strict_types=1);

namespace App\Services\Agents;

use App\Models\User;
use App\Services\Agents\Tools\CompareZonesTool;
use App\Services\Agents\Tools\FeedStatusTool;
use App\Services\Agents\Tools\GetZoneTool;
use App\Services\Agents\Tools\ListZonesTool;
use App\Services\Agents\Tools\MethodologyTool;
use App\Services\Agents\Tools\WatchlistOpportunitiesTool;
use App\Services\Agents\Tools\ZoneHistoryTool;
use Illuminate\Support\Facades\Gate;

/**
 * Injected list of every agent tool. Add new tools here + register the
 * class via container binding in AppServiceProvider if constructor deps
 * need resolution.
 */
class ToolRegistry
{
    /** @var array<int, AgentTool> */
    private array $tools;

    public function __construct(
        GetZoneTool $getZone,
        ListZonesTool $listZones,
        ZoneHistoryTool $history,
        CompareZonesTool $compare,
        MethodologyTool $methodology,
        FeedStatusTool $feeds,
        WatchlistOpportunitiesTool $watchlist,
    ) {
        $this->tools = [$getZone, $listZones, $history, $compare, $methodology, $feeds, $watchlist];
    }

    /** @return list<AgentTool> */
    public function all(): array
    {
        return $this->tools;
    }

    /**
     * Registry narrowed to what this caller may use. Both discovery and
     * execution go through the narrowed copy, so a tool the caller cannot
     * see is also a tool the runtime will refuse to run even if the model
     * names it directly.
     */
    public function forUser(?User $user): self
    {
        $scoped = clone $this;
        $scoped->tools = array_values(array_filter(
            $this->tools,
            fn (AgentTool $tool) => $this->permits($user, $tool),
        ));

        return $scoped;
    }

    private function permits(?User $user, AgentTool $tool): bool
    {
        $ability = $tool->ability();

        if ($ability === null) {
            return true;
        }

        return $user !== null && Gate::forUser($user)->allows($ability);
    }

    public function find(string $name): ?AgentTool
    {
        foreach ($this->tools as $t) {
            if ($t->name() === $name) {
                return $t;
            }
        }

        return null;
    }

    /** @return list<array{name: string, description: string, parameters: array<string,mixed>}> */
    public function schemas(): array
    {
        return array_map(fn (AgentTool $t) => $t->schema(), $this->tools);
    }
}
