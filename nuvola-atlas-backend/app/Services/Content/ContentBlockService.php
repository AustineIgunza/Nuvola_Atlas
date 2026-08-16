<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Models\ContentBlock;
use App\Models\ContentBlockRevision;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * CRUD for CMS content blocks. Every save writes an immutable snapshot
 * to `content_block_revisions` before the block row itself is updated,
 * so a bad edit can be reverted from the audit trail.
 */
class ContentBlockService
{
    public function upsert(string $key, string $body, ?User $editor): ContentBlock
    {
        return DB::transaction(function () use ($key, $body, $editor) {
            $existing = ContentBlock::find($key);

            if ($existing) {
                ContentBlockRevision::create([
                    'content_block_key' => $existing->key,
                    'body_snapshot' => $existing->body,
                    'edited_by' => $editor?->id,
                    'edited_at' => now(),
                ]);
                $existing->body = $body;
                $existing->save();

                return $existing;
            }

            return ContentBlock::create(['key' => $key, 'body' => $body]);
        });
    }

    /** @return Collection<int, ContentBlockRevision> */
    public function revisions(string $key)
    {
        return ContentBlockRevision::query()
            ->where('content_block_key', $key)
            ->orderByDesc('edited_at')
            ->limit(50)
            ->get();
    }
}
