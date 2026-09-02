<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeedbackSubmissionRequest;
use App\Http\Requests\UpdateFeedbackSubmissionRequest;
use App\Http\Resources\FeedbackSubmissionResource;
use App\Models\FeedbackSubmission;
use App\Services\FeedbackStorage;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class FeedbackSubmissionController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private FeedbackStorage $storage) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 25), 100));
        $user = $request->user();

        $query = FeedbackSubmission::query()
            ->with(['submitter', 'reviewer'])
            ->orderByDesc('submitted_at');

        if (! $user->isSuperuser() || $request->boolean('mine')) {
            $query->where('mod_by', $user->ID);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->toString().'%';
            $query->where(function ($inner) use ($term): void {
                $inner->where('subject', 'like', $term)
                    ->orWhere('description', 'like', $term);
            });
        }

        return FeedbackSubmissionResource::collection(
            $query->paginate($perPage)->withQueryString()
        );
    }

    public function store(StoreFeedbackSubmissionRequest $request): JsonResponse
    {
        $this->authorize('create', FeedbackSubmission::class);

        $user = $request->user();
        $feedbackSubmission = new FeedbackSubmission($request->safe()->except(['screenshot']));
        $feedbackSubmission->mod_by = $user->ID;
        $feedbackSubmission->submitter_name ??= trim($user->firstname.' '.$user->lastname);
        $feedbackSubmission->submitter_email ??= $user->username;
        $feedbackSubmission->priority ??= 'medium';
        $feedbackSubmission->status = 'under_review';
        $feedbackSubmission->submitted_at = now();
        $feedbackSubmission->save();

        if ($request->file('screenshot')) {
            $this->storage->store($feedbackSubmission, $request->file('screenshot'));
            $feedbackSubmission->save();
        }

        return (new FeedbackSubmissionResource($feedbackSubmission->load(['submitter', 'reviewer'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, FeedbackSubmission $feedbackSubmission): FeedbackSubmissionResource
    {
        $this->authorize('view', $feedbackSubmission);

        return new FeedbackSubmissionResource($feedbackSubmission->load(['submitter', 'reviewer']));
    }

    public function screenshot(FeedbackSubmission $feedbackSubmission): BinaryFileResponse|JsonResponse
    {
        $this->authorize('view', $feedbackSubmission);

        $path = $this->storage->absolutePath($feedbackSubmission);
        if ($path === null) {
            return response()->json(['message' => 'Screenshot not found.'], 404);
        }

        return response()->file($path, [
            'Content-Disposition' => 'inline; filename="'.basename($path).'"',
        ]);
    }

    public function update(UpdateFeedbackSubmissionRequest $request, FeedbackSubmission $feedbackSubmission): FeedbackSubmissionResource
    {
        $this->authorize('update', $feedbackSubmission);

        $feedbackSubmission->fill($request->validated());

        if ($request->exists('status')) {
            $feedbackSubmission->reviewed_at = now();
            $feedbackSubmission->reviewed_by ??= $request->user()->ID;
        }

        $feedbackSubmission->save();

        return new FeedbackSubmissionResource($feedbackSubmission->refresh()->load(['submitter', 'reviewer']));
    }

    public function destroy(FeedbackSubmission $feedbackSubmission): JsonResponse
    {
        $this->authorize('delete', $feedbackSubmission);

        try {
            $this->storage->deleteManaged($feedbackSubmission);
            $feedbackSubmission->delete();
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cannot delete this feedback submission because other records still reference it.',
            ], 409);
        }

        return response()->json(status: 204);
    }
}
