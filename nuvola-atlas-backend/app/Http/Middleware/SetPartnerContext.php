<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sets `app.current_partner_id` on the Postgres connection at the start of
 * every authenticated request, so the RLS policy on `partner_dataset_overlays`
 * (and any future partner-scoped table) gates rows to the caller's partner.
 *
 * Connection-mode notes:
 *  - With a direct connection or session-mode pgbouncer, set_config(..., false)
 *    sticks for the whole connection. Laravel returns the connection to its
 *    pool between requests, so we must clear it on the way out — otherwise a
 *    later request on the same connection could leak across partners.
 *  - With transaction-mode pgbouncer (Supabase pooler on :6543), session-level
 *    settings don't survive between statements at all. In that mode the safer
 *    pattern is to wrap the request in a transaction and use SET LOCAL. The
 *    pilot uses direct connections, so this middleware is correct as written;
 *    swap to a query listener if/when we move to transaction-mode pooling.
 *
 * For unauthenticated requests (or users with no partner) we clear the var
 * explicitly. With it unset, the RLS policy's NULL comparison hides every
 * row — the safe default.
 */
class SetPartnerContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $partnerId = $user?->partner_id;

        $this->applyPartnerContext($partnerId);

        try {
            return $next($request);
        } finally {
            // Clear before returning the connection to the pool so a later
            // request on the same connection doesn't inherit this partner.
            $this->applyPartnerContext(null);
        }
    }

    private function applyPartnerContext(?int $partnerId): void
    {
        // `false` (the third arg to set_config) = persist for the connection,
        // not just the current transaction. Required outside an explicit tx.
        DB::statement(
            "SELECT set_config('app.current_partner_id', ?, false)",
            [$partnerId === null ? '' : (string) $partnerId]
        );
    }
}
