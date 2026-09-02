<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommunityCommentRequest;
use App\Http\Requests\UpdateCommunityCommentRequest;
use App\Http\Resources\CommunityCommentResource;
use App\Models\DynamicComment;
use App\Models\DynamicPost;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class CommunityCommentController extends Controller
{
    use AuthorizesRequests;

    public function index(DynamicPost $dynamicPost): AnonymousResourceCollection
    {
        return CommunityCommentResource::collection(
            $dynamicPost->comments()
                ->whereNull('parent_ID')
                ->with(['editor', 'replies.editor'])
                ->orderBy('ID')
                ->get()
        );
    }

    public function store(StoreCommunityCommentRequest $request, DynamicPost $dynamicPost): JsonResponse
    {
        $this->authorize('create', DynamicComment::class);

        $parentId = $request->validated('parent_ID');

        if ($parentId !== null) {
            $parent = DynamicComment::query()->find($parentId);

            if ($parent === null || (int) $parent->post_ID !== (int) $dynamicPost->ID) {
                return response()->json([
                    'message' => 'The parent comment does not belong to this post.',
                    'errors' => ['parent_ID' => ['The parent comment does not belong to this post.']],
                ], 422);
            }
        }

        $comment = new DynamicComment($request->safe()->only(['note', 'parent_ID']));
        $comment->post_ID = $dynamicPost->ID;
        $comment->mod_by = $request->user()->ID;
        $comment->save();

        $dynamicPost->refreshEngagementCounts();

        return (new CommunityCommentResource($comment->load(['editor', 'replies.editor'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(DynamicPost $dynamicPost, DynamicComment $dynamicComment): CommunityCommentResource|JsonResponse
    {
        if ((int) $dynamicComment->post_ID !== (int) $dynamicPost->ID) {
            return response()->json(['message' => 'Comment not found on this post.'], 404);
        }

        return new CommunityCommentResource($dynamicComment->load(['editor', 'replies.editor']));
    }

    public function update(
        UpdateCommunityCommentRequest $request,
        DynamicPost $dynamicPost,
        DynamicComment $dynamicComment,
    ): CommunityCommentResource|JsonResponse {
        if ((int) $dynamicComment->post_ID !== (int) $dynamicPost->ID) {
            return response()->json(['message' => 'Comment not found on this post.'], 404);
        }

        $this->authorize('update', $dynamicComment);

        $dynamicComment->fill($request->validated());
        $dynamicComment->mod_date = now();
        $dynamicComment->save();

        return new CommunityCommentResource($dynamicComment->refresh()->load(['editor', 'replies.editor']));
    }

    public function destroy(DynamicPost $dynamicPost, DynamicComment $dynamicComment): JsonResponse
    {
        if ((int) $dynamicComment->post_ID !== (int) $dynamicPost->ID) {
            return response()->json(['message' => 'Comment not found on this post.'], 404);
        }

        $this->authorize('delete', $dynamicComment);

        try {
            $dynamicComment->delete();
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cannot delete this comment because other records still reference it.',
            ], 409);
        }

        $dynamicPost->refreshEngagementCounts();

        return response()->json(status: 204);
    }
}
