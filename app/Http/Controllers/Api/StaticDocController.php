<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaticDocRequest;
use App\Http\Requests\UpdateStaticDocRequest;
use App\Http\Resources\StaticDocResource;
use App\Models\StaticDoc;
use App\Services\StaticDocStorage;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StaticDocController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private StaticDocStorage $storage) {}

    public function index(): AnonymousResourceCollection
    {
        return StaticDocResource::collection(
            StaticDoc::query()
                ->with('editor')
                ->orderBy('id')
                ->get()
        );
    }

    public function store(StoreStaticDocRequest $request): JsonResponse
    {
        $this->authorize('create', StaticDoc::class);

        $staticDoc = new StaticDoc($request->safe()->only(['title', 'subfolder', 'description', 'is_complete']));
        $staticDoc->subfolder = $this->safeSubfolder($staticDoc->subfolder);
        $staticDoc->file = Str::slug((string) $staticDoc->title) ?: 'document';
        $staticDoc->mod_by = $request->user()->ID;
        $staticDoc->save();

        $this->storage->storePdf($staticDoc, $request->file('pdf'));
        if ($request->file('thumbnail')) {
            $this->storage->storeThumbnail($staticDoc, $request->file('thumbnail'));
        } else {
            $this->storage->writePlaceholderThumbnail($staticDoc);
        }
        $staticDoc->save();

        return (new StaticDocResource($staticDoc->load('editor')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(StaticDoc $staticDoc): StaticDocResource
    {
        return new StaticDocResource($staticDoc->load('editor'));
    }

    public function thumbnail(StaticDoc $staticDoc): BinaryFileResponse|JsonResponse
    {
        return $this->serveAsset($staticDoc->thumbnailPath(), ($staticDoc->file ?? 'document').'.png');
    }

    public function pdf(Request $request, StaticDoc $staticDoc): BinaryFileResponse|JsonResponse
    {
        return $this->serveAsset(
            $staticDoc->pdfPath(),
            ($staticDoc->file ?? 'document').'.pdf',
            $request->boolean('download')
        );
    }

    public function update(UpdateStaticDocRequest $request, StaticDoc $staticDoc): StaticDocResource
    {
        $this->authorize('update', $staticDoc);

        $staticDoc->fill($request->safe()->only(['title', 'subfolder', 'description', 'is_complete']));
        if ($request->exists('subfolder')) {
            $staticDoc->subfolder = $this->safeSubfolder($staticDoc->subfolder);
        }

        if ($request->file('pdf')) {
            $this->storage->storePdf($staticDoc, $request->file('pdf'));
        }
        if ($request->file('thumbnail')) {
            $this->storage->storeThumbnail($staticDoc, $request->file('thumbnail'));
        }

        $staticDoc->upload_date = now();
        $staticDoc->save();

        return new StaticDocResource($staticDoc->refresh()->load('editor'));
    }

    public function destroy(StaticDoc $staticDoc): JsonResponse
    {
        $this->authorize('delete', $staticDoc);

        try {
            $this->storage->deleteManaged($staticDoc);
            $staticDoc->delete();
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cannot delete this document because other records still reference it.',
            ], 409);
        }

        return response()->json(status: 204);
    }

    private function serveAsset(?string $path, string $downloadName, bool $download = false): BinaryFileResponse|JsonResponse
    {
        if ($path === null) {
            return response()->json([
                'message' => 'Document file not found.',
            ], 404);
        }

        if ($download) {
            return response()->download($path, $downloadName);
        }

        return response()->file($path);
    }

    private function safeSubfolder(?string $subfolder): string
    {
        $value = trim(str_replace(['\\', "\0"], ['/', ''], (string) $subfolder));
        $segments = array_values(array_filter(
            explode('/', $value),
            fn (string $segment): bool => $segment !== '' && $segment !== '.' && $segment !== '..'
        ));

        return $segments[0] ?? 'Uploads';
    }
}
