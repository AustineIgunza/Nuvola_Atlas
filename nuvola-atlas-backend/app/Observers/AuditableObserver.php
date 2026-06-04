<?php

declare(strict_types=1);

namespace App\Observers;

use App\Support\Audit;
use Illuminate\Database\Eloquent\Model;

/**
 * Generic model observer that writes an audit_log entry on create / update
 * / delete. Apply by registering against any model whose lifecycle the
 * team needs forensic traceability for.
 */
class AuditableObserver
{
    public function created(Model $model): void
    {
        Audit::record(
            action: $this->action($model, 'created'),
            resource: $model,
            after: $model->getAttributes(),
        );
    }

    public function updated(Model $model): void
    {
        $changes = $model->getChanges();
        // Skip pure touch() updates that only bump timestamps.
        if (empty($changes) || array_keys($changes) === ['updated_at']) {
            return;
        }

        $original = array_intersect_key($model->getRawOriginal(), $changes);

        Audit::record(
            action: $this->action($model, 'updated'),
            resource: $model,
            before: $original,
            after: $changes,
        );
    }

    public function deleted(Model $model): void
    {
        Audit::record(
            action: $this->action($model, 'deleted'),
            resource: $model,
            before: $model->getAttributes(),
        );
    }

    private function action(Model $model, string $verb): string
    {
        return strtolower(class_basename($model)).'.'.$verb;
    }
}
