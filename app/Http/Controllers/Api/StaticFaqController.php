<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaticFaqRequest;
use App\Http\Requests\UpdateStaticFaqRequest;
use App\Http\Resources\StaticFaqResource;
use App\Models\StaticFaq;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class StaticFaqController extends Controller
{
    use AuthorizesRequests;

    public function help(): AnonymousResourceCollection
    {
        return StaticFaqResource::collection(
            StaticFaq::query()
                ->with('editor')
                ->whereNotNull('order')
                ->orderBy('order')
                ->orderBy('title')
                ->get()
        );
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 25), 100));

        return StaticFaqResource::collection(
            StaticFaq::query()->orderBy('order')->orderBy('title')->paginate($perPage)->withQueryString()
        );
    }

    public function store(StoreStaticFaqRequest $request): JsonResponse
    {
        $this->authorize('create', StaticFaq::class);

        $staticFaq = new StaticFaq($request->validated());
        $staticFaq->mod_by = $request->user()->ID;
        $staticFaq->save();

        return (new StaticFaqResource($staticFaq->load('editor')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(StaticFaq $staticFaq): StaticFaqResource
    {
        return new StaticFaqResource($staticFaq->load('editor'));
    }

    public function update(UpdateStaticFaqRequest $request, StaticFaq $staticFaq): StaticFaqResource
    {
        $this->authorize('update', $staticFaq);

        $staticFaq->fill($request->validated());
        $staticFaq->mod_by = $request->user()->ID;
        $staticFaq->save();

        return new StaticFaqResource($staticFaq->refresh()->load('editor'));
    }

    public function destroy(StaticFaq $staticFaq): JsonResponse
    {
        $this->authorize('delete', $staticFaq);

        try {
            $staticFaq->delete();
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cannot delete this FAQ because other records still reference it.',
            ], 409);
        }

        return response()->json(status: 204);
    }
}
