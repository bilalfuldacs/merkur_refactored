<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

#[Fillable([
    'table',
    'item_ID',
    'note',
])]
class DynamicPost extends Model
{
    protected $table = 'dynamic__posts';

    protected $primaryKey = 'ID';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::creating(function (DynamicPost $post): void {
            $post->num_replies ??= 0;
            $post->num_comments ??= 0;
            $post->num_likes ??= 0;
            $post->num_dislikes ??= 0;
            $post->num_bookmarks ??= 0;
        });

        static::deleting(function (DynamicPost $post): void {
            $post->replies()->each(fn (DynamicPost $reply) => $reply->delete());
        });
    }

    public function getRouteKeyName(): string
    {
        return 'ID';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'mod_date' => 'datetime',
        ];
    }

    public function isOwnedBy(User $user): bool
    {
        return (int) $this->mod_by === (int) $user->ID;
    }

    public function toggleLike(User $user): void
    {
        $this->toggleReaction(DynamicLike::class, $user, deactivate: DynamicDislike::class);
    }

    public function toggleDislike(User $user): void
    {
        $this->toggleReaction(DynamicDislike::class, $user, deactivate: DynamicLike::class);
    }

    public function toggleBookmark(User $user): void
    {
        $this->toggleReaction(DynamicBookmark::class, $user);
    }

    public function refreshEngagementCounts(): void
    {
        $commentCount = $this->comments()->count();

        static::query()->whereKey($this->ID)->update([
            'num_likes' => $this->likes()->where('active', true)->count(),
            'num_dislikes' => $this->dislikes()->where('active', true)->count(),
            'num_bookmarks' => $this->bookmarks()->where('active', true)->count(),
            'num_comments' => $commentCount,
            'num_replies' => $commentCount,
        ]);

        $this->refresh();
    }

    /**
     * @param  class-string<DynamicLike|DynamicDislike|DynamicBookmark>  $model
     * @param  class-string<DynamicLike|DynamicDislike>|null  $deactivate
     */
    private function toggleReaction(string $model, User $user, ?string $deactivate = null): void
    {
        DB::transaction(function () use ($model, $user, $deactivate): void {
            $extra = $model::query()->firstOrNew([
                'post_ID' => $this->ID,
                'mod_by' => $user->ID,
            ]);

            $extra->active = ! ((bool) $extra->active);
            $extra->mod_by = $user->ID;
            $extra->post_ID = $this->ID;
            $extra->save();

            if ($extra->active && $deactivate !== null) {
                $deactivate::query()
                    ->where('post_ID', $this->ID)
                    ->where('mod_by', $user->ID)
                    ->update(['active' => false]);
            }

            $this->refreshEngagementCounts();
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mod_by', 'ID');
    }

    /**
     * @return BelongsTo<DynamicPost, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_ID', 'ID');
    }

    /**
     * @return HasMany<DynamicPost, $this>
     */
    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_ID', 'ID');
    }

    /**
     * @return HasMany<DynamicComment, $this>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(DynamicComment::class, 'post_ID', 'ID');
    }

    /**
     * @return HasMany<DynamicLike, $this>
     */
    public function likes(): HasMany
    {
        return $this->hasMany(DynamicLike::class, 'post_ID', 'ID');
    }

    /**
     * @return HasMany<DynamicLike, $this>
     */
    public function activeLikes(): HasMany
    {
        return $this->likes()->where('active', true);
    }

    /**
     * @return HasMany<DynamicDislike, $this>
     */
    public function dislikes(): HasMany
    {
        return $this->hasMany(DynamicDislike::class, 'post_ID', 'ID');
    }

    /**
     * @return HasMany<DynamicDislike, $this>
     */
    public function activeDislikes(): HasMany
    {
        return $this->dislikes()->where('active', true);
    }

    /**
     * @return HasMany<DynamicBookmark, $this>
     */
    public function bookmarks(): HasMany
    {
        return $this->hasMany(DynamicBookmark::class, 'post_ID', 'ID');
    }
}
