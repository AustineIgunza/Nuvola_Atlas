<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\ChatConversationResource;
use App\Http\Resources\ChatMessageResource;
use App\Models\ChatConversation;
use App\Services\Chat\AiGatewayClient;
use App\Services\Chat\ChatOrchestrator;
use App\Services\Chat\SqlExecutor;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    public function __construct(private readonly AiGatewayClient $gateway) {}

    public function index(Request $request)
    {
        $conversations = ChatConversation::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->paginate(20);

        return ChatConversationResource::collection($conversations);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:120',
            'zoneId' => 'nullable|string|exists:zones,id',
        ]);

        $conversation = ChatConversation::create([
            'user_id' => $request->user()->id,
            'title' => $data['title'] ?? null,
            'zone_id' => $data['zoneId'] ?? null,
        ]);

        return new ChatConversationResource($conversation);
    }

    public function destroy(Request $request, string $id)
    {
        $conversation = $this->findOwned($request, $id);
        $conversation->delete();

        return response()->noContent();
    }

    public function messages(Request $request, string $id)
    {
        $conversation = $this->findOwned($request, $id);

        return ChatMessageResource::collection(
            $conversation->messages()->orderBy('created_at')->get()
        );
    }

    public function send(Request $request, string $id, ChatOrchestrator $orchestrator): StreamedResponse
    {
        if (! $this->gateway->isConfigured()) {
            abort(503, 'AI is not configured — set AI_GATEWAY_API_KEY.');
        }

        if (! SqlExecutor::isConfigured()) {
            abort(503, 'AI is not configured — set DB_CHAT_RO_USER and DB_CHAT_RO_PASSWORD to a role that is not the primary database user.');
        }

        $data = $request->validate([
            'prompt' => 'required|string|max:2000',
        ]);

        $conversation = $this->findOwned($request, $id);

        return new StreamedResponse(function () use ($orchestrator, $conversation, $data) {
            @ini_set('zlib.output_compression', '0');

            foreach ($orchestrator->handle($conversation, $data['prompt']) as $event) {
                echo $event->toSse();
                if (ob_get_level() > 0) {
                    @ob_flush();
                }
                @flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-transform',
            'X-Accel-Buffering' => 'no', // nginx: don't buffer SSE
            'Connection' => 'keep-alive',
        ]);
    }

    private function findOwned(Request $request, string $id): ChatConversation
    {
        if (! Str::isUuid($id)) {
            abort(404);
        }

        $conversation = ChatConversation::query()
            ->where('user_id', $request->user()->id)
            ->find($id);

        if (! $conversation) {
            abort(404);
        }

        return $conversation;
    }
}
