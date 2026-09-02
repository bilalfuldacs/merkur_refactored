<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMerkuriosityDictionaryRequest;
use App\Http\Requests\UpdateMerkuriosityDictionaryRequest;
use App\Http\Resources\MerkuriosityDictionaryResource;
use App\Models\MerkuriosityDictionary;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class MerkuriosityDictionaryController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 25), 100));

        $query = MerkuriosityDictionary::query()->orderBy('word');

        if ($request->filled('q')) {
            $query->where('word', 'like', $request->string('q')->toString().'%');
        }

        return MerkuriosityDictionaryResource::collection(
            $query->paginate($perPage)->withQueryString()
        );
    }

    public function store(StoreMerkuriosityDictionaryRequest $request): JsonResponse
    {
        $this->authorize('create', MerkuriosityDictionary::class);

        $merkuriosityDictionary = new MerkuriosityDictionary($request->validated());
        $merkuriosityDictionary->save();

        return (new MerkuriosityDictionaryResource($merkuriosityDictionary))
            ->response()
            ->setStatusCode(201);
    }

    public function show(MerkuriosityDictionary $merkuriosityDictionary): MerkuriosityDictionaryResource
    {
        return new MerkuriosityDictionaryResource($merkuriosityDictionary);
    }

    public function update(UpdateMerkuriosityDictionaryRequest $request, MerkuriosityDictionary $merkuriosityDictionary): MerkuriosityDictionaryResource
    {
        $this->authorize('update', $merkuriosityDictionary);

        $merkuriosityDictionary->fill($request->validated());
        $merkuriosityDictionary->save();

        return new MerkuriosityDictionaryResource($merkuriosityDictionary->refresh());
    }

    public function destroy(MerkuriosityDictionary $merkuriosityDictionary): JsonResponse
    {
        $this->authorize('delete', $merkuriosityDictionary);

        try {
            $merkuriosityDictionary->delete();
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cannot delete this dictionary word because other records still reference it.',
            ], 409);
        }

        return response()->json(status: 204);
    }
}
