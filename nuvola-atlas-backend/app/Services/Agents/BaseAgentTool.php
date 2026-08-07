<?php

declare(strict_types=1);

namespace App\Services\Agents;

abstract class BaseAgentTool implements AgentTool
{
    public function schema(): array
    {
        return [
            'name' => $this->name(),
            'description' => $this->description(),
            'parameters' => $this->parameters(),
        ];
    }
}
