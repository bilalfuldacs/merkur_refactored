<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SihRoadmapService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SihRoadmapController extends Controller
{
    public function __construct(private SihRoadmapService $roadmap) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->roadmap->board($this->user($request)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:5000'],
            'year' => ['required', 'integer', 'min:2024', 'max:2040'],
            'quarter' => ['required', 'integer', 'between:1,4'],
            'status' => ['sometimes', 'in:planned,active,done'],
        ]);

        return $this->respond(fn () => $this->roadmap->create($this->user($request), $data), 201);
    }

    public function update(Request $request, int $milestone): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'year' => ['sometimes', 'integer', 'min:2024', 'max:2040'],
            'quarter' => ['sometimes', 'integer', 'between:1,4'],
            'status' => ['sometimes', 'in:planned,active,done'],
            'is_hidden' => ['sometimes', 'boolean'],
        ]);

        return $this->respond(fn () => $this->roadmap->update($this->user($request), $milestone, $data));
    }

    public function destroy(Request $request, int $milestone): JsonResponse
    {
        return $this->respond(fn () => $this->roadmap->destroy($this->user($request), $milestone));
    }

    public function storeLink(Request $request, int $milestone): JsonResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:120'],
            'url' => ['required', 'string', 'max:500', 'regex:/^https?:\/\/\S+$/i'],
        ]);

        return $this->respond(
            fn () => $this->roadmap->addLink($this->user($request), $milestone, $data['label'], $data['url']),
            201,
        );
    }

    public function destroyLink(Request $request, int $milestone, int $link): JsonResponse
    {
        return $this->respond(fn () => $this->roadmap->deleteLink($this->user($request), $milestone, $link));
    }

    public function storeComment(Request $request, int $milestone): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        return $this->respond(
            fn () => $this->roadmap->addComment($this->user($request), $milestone, $data['body']),
            201,
        );
    }

    public function destroyComment(Request $request, int $milestone, int $comment): JsonResponse
    {
        return $this->respond(fn () => $this->roadmap->deleteComment($this->user($request), $milestone, $comment));
    }

    public function storeAttachment(Request $request, int $milestone): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:20480', 'mimes:pdf,png,jpg,jpeg,webp,gif,txt,csv,doc,docx,xls,xlsx,ppt,pptx,zip'],
        ]);
        $file = $request->file('file');
        if (! $file instanceof UploadedFile) {
            return response()->json(['message' => 'Choose a file to upload.'], 422);
        }

        return $this->respond(
            fn () => $this->roadmap->addAttachment($this->user($request), $milestone, $file),
            201,
        );
    }

    public function destroyAttachment(Request $request, int $milestone, int $attachment): JsonResponse
    {
        return $this->respond(fn () => $this->roadmap->deleteAttachment($this->user($request), $milestone, $attachment));
    }

    public function showAttachment(Request $request, int $milestone, int $attachment): BinaryFileResponse|JsonResponse
    {
        try {
            $user = $this->user($request);
            $path = $this->roadmap->attachmentPath($user, $milestone, $attachment);
            $name = $this->roadmap->attachmentName($user, $milestone, $attachment);

            return response()->download($path, $name);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'File not found.'], 404);
        }
    }

    /**
     * @param  callable(): array{milestone_id: int|null, board: array<string, mixed>}  $action
     */
    private function respond(callable $action, int $status = 200): JsonResponse
    {
        try {
            return response()->json($action(), $status);
        } catch (AuthorizationException $exception) {
            return response()->json(['message' => $exception->getMessage()], 403);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Milestone not found.'], 404);
        }
    }

    private function user(Request $request): User
    {
        $user = $request->user();
        if (! $user instanceof User) {
            abort(401);
        }

        return $user;
    }
}
