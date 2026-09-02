<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMerkuriosityWordRequest;
use App\Http\Requests\UpdateMerkuriosityWordRequest;
use App\Http\Resources\MerkuriosityWordResource;
use App\Models\MerkuriosityWord;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class MerkuriosityWordController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 25), 100));

        $query = MerkuriosityWord::query()->orderBy('id');

        if ($request->filled('q')) {
            $query->where('word', 'like', $request->string('q')->toString().'%');
        }

        return MerkuriosityWordResource::collection(
            $query->paginate($perPage)->withQueryString()
        );
    }

    public function store(StoreMerkuriosityWordRequest $request): JsonResponse
    {
        $this->authorize('create', MerkuriosityWord::class);

        $merkuriosityWord = new MerkuriosityWord($request->validated());
        $merkuriosityWord->save();

        return (new MerkuriosityWordResource($merkuriosityWord))
            ->response()
            ->setStatusCode(201);
    }

    public function show(MerkuriosityWord $merkuriosityWord): MerkuriosityWordResource
    {
        return new MerkuriosityWordResource($merkuriosityWord);
    }

    public function update(UpdateMerkuriosityWordRequest $request, MerkuriosityWord $merkuriosityWord): MerkuriosityWordResource
    {
        $this->authorize('update', $merkuriosityWord);

        $merkuriosityWord->fill($request->validated());
        $merkuriosityWord->save();

        return new MerkuriosityWordResource($merkuriosityWord->refresh());
    }

    public function destroy(MerkuriosityWord $merkuriosityWord): JsonResponse
    {
        $this->authorize('delete', $merkuriosityWord);

        try {
            $merkuriosityWord->delete();
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cannot delete this word because other records still reference it.',
            ], 409);
        }

        return response()->json(status: 204);
    }
}
