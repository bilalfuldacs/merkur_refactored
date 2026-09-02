<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommunityPostRequest;
use App\Http\Requests\UpdateCommunityPostRequest;
use App\Http\Resources\CommunityPersonResource;
use App\Http\Resources\CommunityPostResource;
use App\Models\DynamicDislike;
use App\Models\DynamicLike;
use App\Models\DynamicPost;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class CommunityPostController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 25), 100));
        $userId = $request->user()->ID;
        $view = $request->string('view')->toString() ?: 'timeline';

        $query = DynamicPost::query()
            ->whereNull('parent_ID')
            ->with('editor');
        $this->withViewerFlags($query, $userId);

        match ($view) {
            'bookmarks' => $query
                ->join('dynamic__bookmarks as b', function ($join) use ($userId): void {
                    $join->on('b.post_ID', '=', 'dynamic__posts.ID')
                        ->where('b.mod_by', $userId)
                        ->where('b.active', 1);
                })
                ->select('dynamic__posts.*')
                ->orderByDesc('b.mod_date'),
            'mentions' => ($initials = trim((string) $request->user()->initials)) !== ''
                ? $query->where('note', 'like', '%@'.$initials.'%')->orderByDesc('ID')
                : $query->whereRaw('0 = 1'),
            'item' => $request->filled('table') && $request->integer('item_ID') > 0
                ? $query
                    ->where('table', $request->string('table')->toString())
                    ->where('item_ID', $request->integer('item_ID'))
                    ->orderByDesc('ID')
                : $query->whereRaw('0 = 1'),
            default => $query->orderByDesc('ID'),
        };

        return CommunityPostResource::collection(
            $query->paginate($perPage)->withQueryString()
        );
    }

    public function mentionables(): JsonResponse
    {
        $people = User::query()
            ->where('active', 1)
            ->whereNotNull('initials')
            ->where('initials', '!=', '')
            ->orderBy('lastname')
            ->orderBy('firstname')
            ->get(['ID', 'initials', 'firstname', 'lastname', 'jobtitle', 'bcolor', 'color', 'role_ID']);

        return response()->json([
            'data' => $people->map(fn (User $user) => [
                'ID' => $user->ID,
                'initials' => (string) $user->initials,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'name' => trim(($user->firstname ?? '').' '.($user->lastname ?? '')) ?: $user->initials,
                'jobtitle' => $user->jobtitle,
                'bcolor' => $user->bcolor,
                'color' => $user->color,
                'role_ID' => $user->role_ID,
            ])->values(),
        ]);
    }

    public function store(StoreCommunityPostRequest $request): JsonResponse
    {
        $this->authorize('create', DynamicPost::class);

        $post = new DynamicPost($request->safe()->only(['note', 'table', 'item_ID']));
        $post->mod_by = $request->user()->ID;
        $post->save();

        return (new CommunityPostResource($this->loadRelations($post, $request->user()->ID)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, DynamicPost $dynamicPost): CommunityPostResource
    {
        return new CommunityPostResource($this->loadRelations($dynamicPost, $request->user()->ID));
    }

    public function update(UpdateCommunityPostRequest $request, DynamicPost $dynamicPost): CommunityPostResource
    {
        $this->authorize('update', $dynamicPost);

        $dynamicPost->fill($request->validated());
        $dynamicPost->mod_by = $request->user()->ID;
        $dynamicPost->mod_date = now();
        $dynamicPost->save();

        return new CommunityPostResource($this->loadRelations($dynamicPost, $request->user()->ID));
    }

    public function destroy(DynamicPost $dynamicPost): JsonResponse
    {
        $this->authorize('delete', $dynamicPost);

        try {
            $dynamicPost->delete();
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        } catch (QueryException) {
            return response()->json([
                'message' => 'Cannot delete this post because other records still reference it.',
            ], 409);
        }

        return response()->json(status: 204);
    }

    public function toggleLike(Request $request, DynamicPost $dynamicPost): CommunityPostResource
    {
        $dynamicPost->toggleLike($request->user());

        return new CommunityPostResource($this->loadRelations($dynamicPost, $request->user()->ID));
    }

    public function toggleDislike(Request $request, DynamicPost $dynamicPost): CommunityPostResource
    {
        $dynamicPost->toggleDislike($request->user());

        return new CommunityPostResource($this->loadRelations($dynamicPost, $request->user()->ID));
    }

    public function toggleBookmark(Request $request, DynamicPost $dynamicPost): CommunityPostResource
    {
        $dynamicPost->toggleBookmark($request->user());

        return new CommunityPostResource($this->loadRelations($dynamicPost, $request->user()->ID));
    }

    public function likes(DynamicPost $dynamicPost): AnonymousResourceCollection
    {
        return CommunityPersonResource::collection(
            $this->peopleFromReactions($dynamicPost->activeLikes()->with('editor')->orderBy('ID')->get())
        );
    }

    public function dislikes(DynamicPost $dynamicPost): AnonymousResourceCollection
    {
        return CommunityPersonResource::collection(
            $this->peopleFromReactions($dynamicPost->activeDislikes()->with('editor')->orderBy('ID')->get())
        );
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<DynamicPost>  $query
     * @return \Illuminate\Database\Eloquent\Builder<DynamicPost>
     */
    private function withViewerFlags($query, int $userId)
    {
        return $query->withExists([
            'likes as my_like' => fn ($q) => $q->where('mod_by', $userId)->where('active', true),
            'dislikes as my_dislike' => fn ($q) => $q->where('mod_by', $userId)->where('active', true),
            'bookmarks as my_bookmark' => fn ($q) => $q->where('mod_by', $userId)->where('active', true),
        ]);
    }

    private function loadRelations(DynamicPost $dynamicPost, int $userId): DynamicPost
    {
        $query = DynamicPost::query()
            ->whereKey($dynamicPost->ID)
            ->with([
                'editor',
                'comments' => fn ($comments) => $comments->whereNull('parent_ID')->with(['editor', 'replies.editor'])->orderBy('ID'),
                'activeLikes.editor',
                'activeDislikes.editor',
            ]);
        $this->withViewerFlags($query, $userId);

        return $query->firstOrFail();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, DynamicLike|DynamicDislike>  $reactions
     * @return \Illuminate\Support\Collection<int, \App\Models\User>
     */
    private function peopleFromReactions($reactions)
    {
        return $reactions->pluck('editor')->filter()->unique('ID')->values();
    }
}
