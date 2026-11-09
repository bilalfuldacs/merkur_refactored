<?php

namespace App\Services;

use App\Models\SihRoadmapAttachment;
use App\Models\SihRoadmapComment;
use App\Models\SihRoadmapLink;
use App\Models\SihRoadmapMilestone;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SihRoadmapService
{
    /**
     * Published shape of the board. Later milestones extend it.
     *
     * @var array{0: int, 1: int}
     */
    private const WINDOW_START = [2026, 4];

    /**
     * @var array{0: int, 1: int}
     */
    private const WINDOW_END = [2027, 4];

    /**
     * @var list<array{0: int, 1: int, 2: string, 3: string}>
     */
    private const DEFAULTS = [
        [2026, 4, 'Features Catalogue', 'active'],
        [2026, 4, 'Field Trial Overview', 'active'],
        [2026, 4, 'MERKURflow X MERKUR Mars Collaboration', 'active'],
        [2026, 4, 'User Intelligence through Anonymous User Tracking', 'active'],
        [2026, 4, 'Market Reports Extension – Wave 2', 'active'],
        [2026, 4, 'Market Reports – Collaboration with Group Responsible Gaming', 'active'],
        [2027, 1, 'MERKURflow X Business Development Collaboration', 'planned'],
        [2027, 1, 'MERKURflow App for iOS & android', 'planned'],
        [2027, 1, 'Exhibition Intelligence – Data Collection Tool @ ICE2027', 'planned'],
        [2027, 1, 'BETA Version', 'planned'],
        [2027, 2, 'Games Roadmap', 'planned'],
        [2027, 2, 'AI Integration', 'planned'],
    ];

    public function seedIfEmpty(): void
    {
        if (! $this->tablesReady() || SihRoadmapMilestone::query()->exists()) {
            return;
        }

        $userId = User::query()->orderBy('ID')->value('ID');
        if ($userId === null) {
            return;
        }

        $order = [];
        foreach (self::DEFAULTS as [$year, $quarter, $title, $status]) {
            $key = $year.'-'.$quarter;
            $order[$key] = ($order[$key] ?? 0) + 1;
            SihRoadmapMilestone::query()->create([
                'title' => $title,
                'description' => null,
                'year' => $year,
                'quarter' => $quarter,
                'status' => $status,
                'is_hidden' => false,
                'sort_order' => $order[$key],
                'created_by' => $userId,
                'mod_by' => $userId,
                'mod_date' => now(),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function board(User $user): array
    {
        $canEdit = $this->canEdit($user);
        $milestones = $this->milestonesQuery($canEdit)->get();
        $now = $this->currentQuarter();
        $grouped = $milestones->groupBy(fn (SihRoadmapMilestone $milestone): string => $milestone->year.'-'.$milestone->quarter);

        $quarters = [];
        foreach ($this->span($milestones) as [$year, $quarter]) {
            /** @var Collection<int, SihRoadmapMilestone> $rows */
            $rows = $grouped->get($year.'-'.$quarter, collect());
            $quarters[] = [
                'year' => $year,
                'quarter' => $quarter,
                'current' => $year === $now['year'] && $quarter === $now['quarter'],
                'milestones' => $rows
                    ->sortBy([['sort_order', 'asc'], ['ID', 'asc']])
                    ->map(fn (SihRoadmapMilestone $milestone): array => $this->present($user, $milestone))
                    ->values()
                    ->all(),
            ];
        }

        return [
            'can_edit' => $canEdit,
            'now' => $now,
            'quarters' => $quarters,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function create(User $user, array $data): array
    {
        $this->assertEditor($user);
        $year = (int) $data['year'];
        $quarter = (int) $data['quarter'];
        $status = isset($data['status']) ? (string) $data['status'] : 'planned';

        $milestone = DB::transaction(function () use ($user, $data, $year, $quarter, $status): SihRoadmapMilestone {
            $next = (int) SihRoadmapMilestone::query()
                ->where('year', $year)
                ->where('quarter', $quarter)
                ->max('sort_order') + 1;

            return SihRoadmapMilestone::query()->create([
                'title' => trim((string) $data['title']),
                'description' => $this->nullableText($data['description'] ?? null),
                'year' => $year,
                'quarter' => $quarter,
                'status' => $status,
                'is_hidden' => false,
                'sort_order' => $next,
                'created_by' => $user->ID,
                'mod_by' => $user->ID,
                'mod_date' => now(),
            ]);
        });

        return $this->result($user, (int) $milestone->ID);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function update(User $user, int $id, array $data): array
    {
        $milestone = $this->editable($user, $id);

        DB::transaction(function () use ($milestone, $user, $data): void {
            if (array_key_exists('title', $data)) {
                $milestone->title = trim((string) $data['title']);
            }
            if (array_key_exists('description', $data)) {
                $milestone->description = $this->nullableText($data['description']);
            }
            if (array_key_exists('status', $data)) {
                $milestone->status = (string) $data['status'];
            }
            if (array_key_exists('is_hidden', $data)) {
                $milestone->is_hidden = (bool) $data['is_hidden'];
            }

            $year = array_key_exists('year', $data) ? (int) $data['year'] : (int) $milestone->year;
            $quarter = array_key_exists('quarter', $data) ? (int) $data['quarter'] : (int) $milestone->quarter;
            $moved = $year !== (int) $milestone->year || $quarter !== (int) $milestone->quarter;
            if ($moved) {
                $milestone->year = $year;
                $milestone->quarter = $quarter;
                $milestone->sort_order = (int) SihRoadmapMilestone::query()
                    ->where('year', $year)
                    ->where('quarter', $quarter)
                    ->where('ID', '!=', $milestone->ID)
                    ->max('sort_order') + 1;
            }

            $milestone->mod_by = $user->ID;
            $milestone->mod_date = now();
            $milestone->save();
        });

        return $this->result($user, (int) $milestone->ID);
    }

    /**
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function destroy(User $user, int $id): array
    {
        $milestone = $this->editable($user, $id);
        if (! $this->canDelete($user, $milestone)) {
            throw new AuthorizationException('You cannot remove this milestone. Hide it instead.');
        }

        DB::transaction(function () use ($milestone): void {
            $milestone->delete();
        });
        Storage::disk('local')->deleteDirectory($this->directory((int) $id));

        return $this->result($user, null);
    }

    /**
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function addLink(User $user, int $id, string $label, string $url): array
    {
        $milestone = $this->editable($user, $id);
        $next = (int) $milestone->links()->max('sort_order') + 1;
        $milestone->links()->create([
            'label' => trim($label),
            'url' => trim($url),
            'sort_order' => $next,
        ]);
        $this->touch($milestone, $user);

        return $this->result($user, (int) $milestone->ID);
    }

    /**
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function deleteLink(User $user, int $id, int $linkId): array
    {
        $milestone = $this->editable($user, $id);
        $link = SihRoadmapLink::query()->find($linkId);
        if ($link === null || (int) $link->milestone_ID !== (int) $milestone->ID) {
            throw new ModelNotFoundException();
        }
        $link->delete();
        $this->touch($milestone, $user);

        return $this->result($user, (int) $milestone->ID);
    }

    /**
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function addComment(User $user, int $id, string $body): array
    {
        $milestone = $this->editable($user, $id);
        $milestone->comments()->create([
            'body' => trim($body),
            'mod_by' => $user->ID,
            'mod_date' => now(),
        ]);
        $this->touch($milestone, $user);

        return $this->result($user, (int) $milestone->ID);
    }

    /**
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function deleteComment(User $user, int $id, int $commentId): array
    {
        $milestone = $this->editable($user, $id);
        $comment = SihRoadmapComment::query()->find($commentId);
        if ($comment === null || (int) $comment->milestone_ID !== (int) $milestone->ID) {
            throw new ModelNotFoundException();
        }
        $comment->delete();
        $this->touch($milestone, $user);

        return $this->result($user, (int) $milestone->ID);
    }

    /**
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function addAttachment(User $user, int $id, UploadedFile $file): array
    {
        $milestone = $this->editable($user, $id);
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $extension = preg_replace('/[^a-z0-9]/', '', $extension) ?: 'bin';
        $stored = Str::uuid()->toString().'.'.$extension;
        Storage::disk('local')->putFileAs($this->directory((int) $milestone->ID), $file, $stored);

        $milestone->attachments()->create([
            'original_name' => $this->safeOriginalName($file),
            'stored_name' => $stored,
            'mime' => $file->getClientMimeType() ?: 'application/octet-stream',
            'size' => (int) $file->getSize(),
            'mod_by' => $user->ID,
            'mod_date' => now(),
        ]);
        $this->touch($milestone, $user);

        return $this->result($user, (int) $milestone->ID);
    }

    /**
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function deleteAttachment(User $user, int $id, int $attachmentId): array
    {
        $milestone = $this->editable($user, $id);
        $attachment = $this->attachmentFor($milestone, $attachmentId);
        Storage::disk('local')->delete($this->directory((int) $milestone->ID).'/'.$attachment->stored_name);
        $attachment->delete();
        $this->touch($milestone, $user);

        return $this->result($user, (int) $milestone->ID);
    }

    public function attachmentPath(User $user, int $id, int $attachmentId): string
    {
        $milestone = $this->visible($user, $id);
        $attachment = $this->attachmentFor($milestone, $attachmentId);
        $path = $this->directory((int) $milestone->ID).'/'.$attachment->stored_name;
        if (! Storage::disk('local')->exists($path)) {
            throw new ModelNotFoundException();
        }

        return Storage::disk('local')->path($path);
    }

    public function attachmentName(User $user, int $id, int $attachmentId): string
    {
        $milestone = $this->visible($user, $id);
        $attachment = $this->attachmentFor($milestone, $attachmentId);

        return $attachment->original_name;
    }

    public function canEdit(User $user): bool
    {
        return $user->canCreateUpdateItems() || $user->isSuperuser();
    }

    private function tablesReady(): bool
    {
        return SihRoadmapMilestone::query()->getConnection()->getSchemaBuilder()->hasTable('sih_roadmap_milestones');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<SihRoadmapMilestone>
     */
    private function milestonesQuery(bool $canEdit)
    {
        $query = SihRoadmapMilestone::query()->with([
            'links',
            'comments.editor',
            'attachments',
        ]);

        if (! $canEdit) {
            $query->where('is_hidden', false);
        }

        return $query;
    }

    /**
     * @param  Collection<int, SihRoadmapMilestone>  $milestones
     * @return list<array{0: int, 1: int}>
     */
    private function span(Collection $milestones): array
    {
        $start = self::WINDOW_START;
        $end = self::WINDOW_END;
        $now = $this->currentQuarter();
        $points = $milestones
            ->map(fn (SihRoadmapMilestone $milestone): array => [(int) $milestone->year, (int) $milestone->quarter])
            ->push([$now['year'], $now['quarter']])
            ->all();

        foreach ($points as [$year, $quarter]) {
            if ($this->compare($year, $quarter, $start[0], $start[1]) < 0) {
                $start = [$year, $quarter];
            }
            if ($this->compare($year, $quarter, $end[0], $end[1]) > 0) {
                $end = [$year, $quarter];
            }
        }

        $cursor = $start;
        $quarters = [];
        while ($this->compare($cursor[0], $cursor[1], $end[0], $end[1]) <= 0) {
            $quarters[] = $cursor;
            $cursor = $cursor[1] === 4 ? [$cursor[0] + 1, 1] : [$cursor[0], $cursor[1] + 1];
        }

        return $quarters;
    }

    /**
     * @return array{year: int, quarter: int}
     */
    private function currentQuarter(): array
    {
        $today = now();

        return [
            'year' => (int) $today->year,
            'quarter' => (int) ceil(((int) $today->month) / 3),
        ];
    }

    private function compare(int $year, int $quarter, int $otherYear, int $otherQuarter): int
    {
        return ($year * 10 + $quarter) <=> ($otherYear * 10 + $otherQuarter);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(User $user, SihRoadmapMilestone $milestone): array
    {
        return [
            'id' => (int) $milestone->ID,
            'title' => $milestone->title,
            'description' => $milestone->description,
            'year' => (int) $milestone->year,
            'quarter' => (int) $milestone->quarter,
            'status' => $milestone->status,
            'is_hidden' => (bool) $milestone->is_hidden,
            'can_delete' => $this->canDelete($user, $milestone),
            'updated_at' => $milestone->mod_date?->toIso8601String(),
            'links' => $milestone->links->map(fn (SihRoadmapLink $link): array => [
                'id' => (int) $link->ID,
                'label' => $link->label,
                'url' => $link->url,
            ])->values()->all(),
            'comments' => $milestone->comments->map(fn (SihRoadmapComment $comment): array => [
                'id' => (int) $comment->ID,
                'body' => $comment->body,
                'created_at' => $comment->mod_date?->toIso8601String(),
                'author' => $this->author($comment->editor),
            ])->values()->all(),
            'attachments' => $milestone->attachments->map(fn (SihRoadmapAttachment $file): array => [
                'id' => (int) $file->ID,
                'name' => $file->original_name,
                'mime' => $file->mime,
                'size' => (int) $file->size,
            ])->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function author(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        return [
            'ID' => (int) $user->ID,
            'name' => $user->displayName(),
            'initials' => $user->initials,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'username' => $user->username,
            'bcolor' => $user->bcolor,
            'color' => $user->color,
            'role_ID' => $user->role_ID === null ? null : (int) $user->role_ID,
        ];
    }

    private function visible(User $user, int $id): SihRoadmapMilestone
    {
        $milestone = SihRoadmapMilestone::query()->find($id);
        if ($milestone === null || ($milestone->is_hidden && ! $this->canEdit($user))) {
            throw (new ModelNotFoundException())->setModel(SihRoadmapMilestone::class, [$id]);
        }

        return $milestone;
    }

    private function editable(User $user, int $id): SihRoadmapMilestone
    {
        $milestone = $this->visible($user, $id);
        $this->assertEditor($user);

        return $milestone;
    }

    private function assertEditor(User $user): void
    {
        if (! $this->canEdit($user)) {
            throw new AuthorizationException('Only the SIH team can change the roadmap.');
        }
    }

    private function canDelete(User $user, SihRoadmapMilestone $milestone): bool
    {
        return $this->canEdit($user) && (
            $user->isSuperuser()
            || $user->canDeleteItems()
            || (int) $milestone->created_by === (int) $user->ID
        );
    }

    private function touch(SihRoadmapMilestone $milestone, User $user): void
    {
        $milestone->mod_by = $user->ID;
        $milestone->mod_date = now();
        $milestone->save();
    }

    private function attachmentFor(SihRoadmapMilestone $milestone, int $attachmentId): SihRoadmapAttachment
    {
        $attachment = SihRoadmapAttachment::query()->find($attachmentId);
        if ($attachment === null || (int) $attachment->milestone_ID !== (int) $milestone->ID) {
            throw new ModelNotFoundException();
        }

        return $attachment;
    }

    private function directory(int $milestoneId): string
    {
        return 'sih-roadmap/'.$milestoneId;
    }

    private function nullableText(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }
        $text = trim($value);

        return $text === '' ? null : $text;
    }

    private function safeOriginalName(UploadedFile $file): string
    {
        $name = basename(str_replace('\\', '/', $file->getClientOriginalName()));
        $name = preg_replace('/[^\p{L}\p{N}._ \-]+/u', '', $name) ?? '';
        $name = trim($name);
        if ($name === '' || $name === '.' || $name === '..') {
            $name = 'attachment';
        }

        return mb_substr($name, 0, 255);
    }

    /**
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    private function result(User $user, ?int $milestoneId): array
    {
        return [
            'milestone_id' => $milestoneId,
            'board' => $this->board($user),
        ];
    }
}
