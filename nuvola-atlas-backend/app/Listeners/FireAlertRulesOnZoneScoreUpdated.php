<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\NewAlertCreated;
use App\Events\ZoneScoreUpdated;
use App\Models\Alert;
use App\Models\AlertRule;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Automation — watches every ZoneScoreUpdated broadcast, checks each
 * active AlertRule for the affected zone, and if the threshold trips:
 *
 *   1. Creates an Alert row (severity derived from the delta size).
 *   2. Updates the rule's last_score_seen + last_fired_at (throttle).
 *   3. Queues an email notification to every firm user attached to
 *      the rule's firm (or to admins for platform-level rules).
 *
 * Runs on the queue so a fleet-wide RecalculateAllZones burst doesn't
 * block the request path with 17 zones × N rules × M users of mail work.
 */
class FireAlertRulesOnZoneScoreUpdated implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function handle(ZoneScoreUpdated $event): void
    {
        $zone = $event->zone;
        $currentScore = $zone->score;

        $rules = AlertRule::query()
            ->where('zone_id', $zone->id)
            ->where('active', true)
            ->get();

        foreach ($rules as $rule) {
            if (! $rule->shouldFire($currentScore)) {
                $rule->last_score_seen = $currentScore;
                $rule->save();
                continue;
            }

            $delta = $rule->last_score_seen !== null ? $currentScore - $rule->last_score_seen : 0;
            $severity = match (true) {
                abs($delta) >= 15 => 'high',
                abs($delta) >= 8 => 'medium',
                default => 'low',
            };

            $alert = Alert::create([
                'id' => (string) Str::uuid(),
                'severity' => $severity,
                'kind' => 'vitality',
                'title' => "Vitality threshold triggered for {$zone->name}",
                'body' => $this->formatBody($rule, $zone, $currentScore, $delta),
                'zone_id' => $zone->id,
                'read' => false,
            ]);

            $rule->last_fired_at = now();
            $rule->last_score_seen = $currentScore;
            $rule->save();

            NewAlertCreated::dispatch($alert);

            $this->notifyFirm($rule, $alert);

            Audit::record('alert_rule.fired', $rule, null, [
                'alert_id' => $alert->id,
                'score' => $currentScore,
                'delta' => $delta,
                'direction' => $rule->direction,
                'threshold' => $rule->threshold_score,
            ]);
        }
    }

    private function formatBody(AlertRule $rule, $zone, int $currentScore, int $delta): string
    {
        $arrow = $delta > 0 ? '+' : '';
        return match ($rule->direction) {
            'below' => "{$zone->name} dropped to {$currentScore} (threshold {$rule->threshold_score}, {$arrow}{$delta}).",
            'above' => "{$zone->name} rose to {$currentScore} (threshold {$rule->threshold_score}, {$arrow}{$delta}).",
            'change' => "{$zone->name} moved by {$delta} to {$currentScore} (threshold |{$rule->threshold_score}|).",
            default => "Alert triggered on {$zone->name}.",
        };
    }

    private function notifyFirm(AlertRule $rule, Alert $alert): void
    {
        try {
            if ($rule->firm_id === null) {
                // Platform rule — no firm scope, nothing to email here.
                return;
            }

            $recipients = User::query()
                ->where('primary_firm_id', $rule->firm_id)
                ->pluck('email')
                ->all();

            if (empty($recipients)) return;

            $body = "Alert: {$alert->title}\n\n{$alert->body}\n\nView in Navuuna Atlas.";
            foreach ($recipients as $email) {
                Mail::raw($body, function ($mail) use ($email, $alert) {
                    $mail->to($email)->subject('[Navuuna Atlas] ' . $alert->title);
                });
            }
        } catch (\Throwable $e) {
            Log::warning('alert_rule_notify_failed', ['rule_id' => $rule->id, 'error' => $e->getMessage()]);
        }
    }
}
