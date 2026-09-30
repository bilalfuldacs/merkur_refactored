<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeedbackSubmissionRequest;
use App\Http\Requests\UpdateFeedbackSubmissionRequest;
use App\Http\Resources\FeedbackSubmissionResource;
use App\Models\FeedbackSubmission;
use App\Services\FeedbackStorage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

        $this->applyAdminFilters($query, $request);

        return FeedbackSubmissionResource::collection(
            $query->paginate($perPage)->withQueryString()
        );
    }

    public function export(Request $request): StreamedResponse|JsonResponse
    {
        $user = $request->user();
        if (! $user?->isSuperuser()) {
            return response()->json(['message' => 'Superuser access required.'], 403);
        }

        $query = FeedbackSubmission::query()->orderByDesc('submitted_at');
        $this->applyAdminFilters($query, $request);

        $filename = 'merkurflow-feedback-export-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'Ref', 'Submitted', 'Name', 'Email', 'Department', 'Type', 'Related Area',
                'Subject', 'Description', 'Expected Impact', 'Priority', 'Status',
                'Reviewed At', 'Reviewed By', 'Admin Notes',
            ]);

            $query->chunk(200, function ($chunk) use ($handle): void {
                foreach ($chunk as $row) {
                    /** @var FeedbackSubmission $row */
                    fputcsv($handle, [
                        $row->reference(),
                        optional($row->submitted_at)?->format('Y-m-d H:i:s'),
                        $row->submitter_name,
                        $row->submitter_email,
                        $row->department,
                        $row->feedback_type,
                        $row->related_area,
                        $row->subject,
                        $row->description,
                        $row->expected_impact,
                        $row->priority,
                        $row->status,
                        optional($row->reviewed_at)?->format('Y-m-d H:i:s'),
                        $row->reviewed_by,
                        $row->admin_notes,
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=utf-8',
        ]);
    }

    private function applyAdminFilters(Builder $query, Request $request): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('department')) {
            $query->where('department', $request->string('department')->toString());
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority')->toString());
        }

        if ($request->filled('feedback_type') || $request->filled('type')) {
            $raw = $request->filled('feedback_type')
                ? $request->string('feedback_type')->toString()
                : $request->string('type')->toString();
            $stored = FeedbackSubmission::storedType($raw);
            $query->where(function (Builder $inner) use ($raw, $stored): void {
                $inner->where('feedback_type', $raw)
                    ->orWhere('feedback_type', $stored);
                $uxKey = array_search($stored, FeedbackSubmission::UX_TYPES, true);
                if (is_string($uxKey)) {
                    $inner->orWhere('feedback_type', $uxKey);
                }
            });
        }

        if ($request->filled('q') || $request->filled('search')) {
            $term = '%'.($request->filled('q')
                ? $request->string('q')->toString()
                : $request->string('search')->toString()).'%';
            $query->where(function (Builder $inner) use ($term): void {
                $inner->where('subject', 'like', $term)
                    ->orWhere('description', 'like', $term)
                    ->orWhere('submitter_name', 'like', $term)
                    ->orWhere('submitter_email', 'like', $term);
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('submitted_at', '>=', $request->string('date_from')->toString());
        }

        if ($request->filled('date_to')) {
            $query->whereDate('submitted_at', '<=', $request->string('date_to')->toString());
        }
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

        if ($request->exists('status') || $request->exists('admin_notes')) {
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
