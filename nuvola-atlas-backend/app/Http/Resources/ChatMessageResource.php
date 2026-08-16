<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Followups are piggybacked on result_rows via a sentinel row.
        // Extract them out so the client sees a clean shape.
        $rows = $this->result_rows ?? [];
        $followups = null;
        $cleanRows = [];
        foreach ($rows as $row) {
            if (is_array($row) && array_key_exists('__followups__', $row)) {
                $followups = $row['__followups__'];

                continue;
            }
            $cleanRows[] = $row;
        }

        return [
            'id' => $this->id,
            'role' => $this->role,
            'content' => $this->content,
            'intent' => $this->intent,
            'sql' => $this->generated_sql,
            'resultRows' => $this->when(! empty($cleanRows), $cleanRows),
            'followups' => $this->when($followups !== null, $followups),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
