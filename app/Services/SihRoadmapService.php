<?php

namespace App\Services;

use App\Models\SihRoadmapAttachment;
use App\Models\SihRoadmapComment;
use App\Models\SihRoadmapEditor;
use App\Models\SihRoadmapLink;
use App\Models\SihRoadmapMilestone;
use App\Models\SihRoadmapQuarter;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SihRoadmapService
{
    public const STATUS_LABELS = [
        'planned' => 'Planned',
        'active' => 'In progress',
        'done' => 'Done',
        'paused' => 'Paused',
    ];

    public const MAX_LINKS = 8;

    public const MAX_FILES = 8;

    /** Upload cap in kilobytes (12 MB, same as the original board). */
    public const FILE_MAX_KB = 12288;

    private const MAX_YEAR = 2036;

    /**
     * Published shape of the board. Used to seed the quarters table once.
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

    /** @var array<int, bool> */
    private array $editCache = [];

    public function seedIfEmpty(): void
    {
        if (! $this->tablesReady() || SihRoadmapMilestone::query()->exists()) {
            $this->ensureQuarters();

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

        $this->ensureQuarters();
    }

    /**
     * Fill the quarters table once from the published window, the milestones and the current quarter.
     */
    public function ensureQuarters(): void
    {
        if (! Schema::hasTable('sih_roadmap_quarters') || SihRoadmapQuarter::query()->exists()) {
            return;
        }

        $start = self::WINDOW_START;
        $end = self::WINDOW_END;
        $now = $this->currentQuarter();
        $points = [[$now['year'], $now['quarter']]];
        if (Schema::hasTable('sih_roadmap_milestones')) {
            $rows = SihRoadmapMilestone::query()->select(['year', 'quarter'])->distinct()->get();
            foreach ($rows as $row) {
                $points[] = [(int) $row->year, (int) $row->quarter];
            }
        }

        foreach ($points as [$year, $quarter]) {
            if ($this->compare($year, $quarter, $start[0], $start[1]) < 0) {
                $start = [$year, $quarter];
            }
            if ($this->compare($year, $quarter, $end[0], $end[1]) > 0) {
                $end = [$year, $quarter];
            }
        }

        $cursor = $start;
        while ($this->compare($cursor[0], $cursor[1], $end[0], $end[1]) <= 0) {
            SihRoadmapQuarter::query()->firstOrCreate(['year' => $cursor[0], 'quarter' => $cursor[1]]);
            $cursor = $cursor[1] === 4 ? [$cursor[0] + 1, 1] : [$cursor[0], $cursor[1] + 1];
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function board(User $user): array
    {
        $this->ensureQuarters();

        $canEdit = $this->canEdit($user);
        $mayManage = $this->mayManageEditors($user);
        $milestones = $this->milestonesQuery($canEdit)->get();
        $now = $this->currentQuarter();
        $today = now()->toDateString();
        $grouped = $milestones->groupBy(fn (SihRoadmapMilestone $milestone): string => $milestone->year.'-'.$milestone->quarter);

        $rows = SihRoadmapQuarter::query()->orderBy('year')->orderBy('quarter')->get();
        $lastId = $rows->last()?->ID;

        $quarters = [];
        foreach ($rows as $row) {
            $year = (int) $row->year;
            $quarter = (int) $row->quarter;
            /** @var Collection<int, SihRoadmapMilestone> $items */
            $items = $grouped->get($year.'-'.$quarter, collect());
            $starts = $this->quarterStart($year, $quarter);
            $ends = $this->quarterEnd($year, $quarter);
            $quarters[] = [
                'id' => (int) $row->ID,
                'label' => $this->quarterLabel($year, $quarter),
                'year' => $year,
                'quarter' => $quarter,
                'starts_on' => $starts,
                'ends_on' => $ends,
                'current' => $year === $now['year'] && $quarter === $now['quarter'],
                'is_past' => $ends < $today,
                'can_remove' => $canEdit && $rows->count() > 1 && (int) $row->ID === (int) $lastId && $this->quarterIsEmpty($year, $quarter),
                'milestones' => $items
                    ->sortBy([['sort_order', 'asc'], ['ID', 'asc']])
                    ->map(fn (SihRoadmapMilestone $milestone): array => $this->present($user, $milestone))
                    ->values()
                    ->all(),
            ];
        }

        $counts = ['active' => 0, 'planned' => 0, 'done' => 0, 'paused' => 0];
        $focus = [];
        $currentItems = [];
        foreach ($quarters as $quarter) {
            foreach ($quarter['milestones'] as $milestone) {
                if ($milestone['is_hidden']) {
                    continue;
                }
                $counts[$milestone['status']] = ($counts[$milestone['status']] ?? 0) + 1;
                if ($milestone['status'] === 'active') {
                    $focus[] = $milestone;
                }
                if ($quarter['current']) {
                    $currentItems[] = $milestone;
                }
            }
        }

        $focusLabel = 'What we are doing now';
        if ($focus === []) {
            $focus = $currentItems;
            $focusLabel = 'Coming up in '.$this->quarterLabel($now['year'], $now['quarter']);
        }

        $payload = [
            'can_edit' => $canEdit,
            'may_manage_editors' => $mayManage,
            'now' => $now + ['label' => $this->quarterLabel($now['year'], $now['quarter'])],
            'counts' => $counts,
            'focus_label' => $focusLabel,
            'focus' => $focus,
            'statuses' => self::STATUS_LABELS,
            'quarters' => $quarters,
        ];
        if ($mayManage) {
            $payload['editors'] = $this->editors();
        }

        return $payload;
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
        $this->quarterRow($year, $quarter);

        $milestone = DB::transaction(function () use ($user, $data, $year, $quarter): SihRoadmapMilestone {
            $next = (int) SihRoadmapMilestone::query()
                ->where('year', $year)
                ->where('quarter', $quarter)
                ->max('sort_order') + 1;

            return SihRoadmapMilestone::query()->create([
                'title' => trim((string) $data['title']),
                'description' => $this->nullableText($data['description'] ?? null),
                'year' => $year,
                'quarter' => $quarter,
                'status' => 'planned',
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

        $year = array_key_exists('year', $data) ? (int) $data['year'] : (int) $milestone->year;
        $quarter = array_key_exists('quarter', $data) ? (int) $data['quarter'] : (int) $milestone->quarter;
        $this->quarterRow($year, $quarter);

        $targetDate = array_key_exists('target_date', $data)
            ? $this->nullableText($data['target_date'])
            : $milestone->target_date?->format('Y-m-d');
        if ($targetDate !== null) {
            $starts = $this->quarterStart($year, $quarter);
            $ends = $this->quarterEnd($year, $quarter);
            if ($targetDate < $starts || $targetDate > $ends) {
                throw ValidationException::withMessages([
                    'target_date' => 'That date is outside '.$this->quarterLabel($year, $quarter).'. Change the quarter, or pick a date inside it.',
                ]);
            }
        }

        DB::transaction(function () use ($milestone, $user, $data, $year, $quarter, $targetDate): void {
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
            $milestone->target_date = $targetDate;

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

        DB::transaction(function () use ($milestone): void {
            $milestone->delete();
        });
        Storage::disk('local')->deleteDirectory($this->directory((int) $id));

        return $this->result($user, null);
    }

    /**
     * Swap a milestone with its neighbour inside the same quarter.
     *
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function move(User $user, int $id, string $direction): array
    {
        $milestone = $this->editable($user, $id);

        DB::transaction(function () use ($milestone, $direction): void {
            $ids = SihRoadmapMilestone::query()
                ->where('year', $milestone->year)
                ->where('quarter', $milestone->quarter)
                ->orderBy('sort_order')
                ->orderBy('ID')
                ->pluck('ID')
                ->map(fn ($value): int => (int) $value)
                ->all();
            $index = array_search((int) $milestone->ID, $ids, true);
            if ($index === false) {
                return;
            }
            $swap = $direction === 'down' ? $index + 1 : $index - 1;
            if (! isset($ids[$swap])) {
                return;
            }
            [$ids[$index], $ids[$swap]] = [$ids[$swap], $ids[$index]];
            foreach ($ids as $position => $milestoneId) {
                SihRoadmapMilestone::query()->where('ID', $milestoneId)->update(['sort_order' => ($position + 1) * 10]);
            }
        });

        return $this->result($user, (int) $milestone->ID);
    }

    /**
     * Append the quarter after the last one. No milestones are created.
     *
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function addQuarter(User $user): array
    {
        $this->assertEditor($user);

        DB::transaction(function (): void {
            $last = SihRoadmapQuarter::query()->orderByDesc('year')->orderByDesc('quarter')->lockForUpdate()->first();
            if ($last === null) {
                $now = $this->currentQuarter();
                $year = $now['year'];
                $quarter = $now['quarter'];
            } else {
                $year = (int) $last->year;
                $quarter = (int) $last->quarter + 1;
                if ($quarter > 4) {
                    $quarter = 1;
                    $year++;
                }
            }
            if ($year > self::MAX_YEAR) {
                throw ValidationException::withMessages(['quarter' => 'The roadmap already reaches far enough ahead.']);
            }
            SihRoadmapQuarter::query()->firstOrCreate(['year' => $year, 'quarter' => $quarter]);
        });

        return $this->result($user, null);
    }

    /**
     * Remove the trailing quarter, only when it is empty.
     *
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function removeQuarter(User $user, int $id): array
    {
        $this->assertEditor($user);

        DB::transaction(function () use ($id): void {
            $target = SihRoadmapQuarter::query()->find($id);
            if ($target === null) {
                throw new ModelNotFoundException();
            }
            $last = SihRoadmapQuarter::query()->orderByDesc('year')->orderByDesc('quarter')->first();
            if ($last === null || (int) $last->ID !== (int) $target->ID) {
                throw ValidationException::withMessages(['quarter' => 'Only the last empty quarter can be removed.']);
            }
            if (SihRoadmapQuarter::query()->count() <= 1) {
                throw ValidationException::withMessages(['quarter' => 'Keep at least one quarter on the roadmap.']);
            }
            if (! $this->quarterIsEmpty((int) $target->year, (int) $target->quarter)) {
                throw ValidationException::withMessages(['quarter' => 'Move or remove the milestones in that quarter first.']);
            }
            $target->delete();
        });

        return $this->result($user, null);
    }

    /**
     * @return array{milestone_id: int|null, board: array<string, mixed>}
     */
    public function addLink(User $user, int $id, string $label, string $url): array
    {
        $milestone = $this->editable($user, $id);
        if ($milestone->links()->count() >= self::MAX_LINKS) {
            throw ValidationException::withMessages(['url' => 'A milestone can have up to '.self::MAX_LINKS.' links.']);
        }
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
        if ($milestone->attachments()->count() >= self::MAX_FILES) {
            throw ValidationException::withMessages(['file' => 'A milestone can have up to '.self::MAX_FILES.' attachments.']);
        }
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

    /**
     * Superuser, SIH job title ("Strategic Intelligence") or an explicit editor row.
     */
    public function canEdit(User $user): bool
    {
        $key = (int) $user->ID;
        if (array_key_exists($key, $this->editCache)) {
            return $this->editCache[$key];
        }

        if ($user->active === false) {
            return $this->editCache[$key] = false;
        }

        $allowed = $user->isSuperuser()
            || $this->isSihJobTitle((string) ($user->jobtitle ?? ''))
            || (Schema::hasTable('sih_roadmap_editors') && SihRoadmapEditor::query()->where('user_ID', $user->ID)->exists());

        return $this->editCache[$key] = $allowed;
    }

    public function mayManageEditors(User $user): bool
    {
        return $user->isSuperuser();
    }

    /**
     * @return list<array{user_id: int, name: string, initials: string|null, jobtitle: string, source: string, removable: bool}>
     */
    public function editors(): array
    {
        $explicit = SihRoadmapEditor::query()->pluck('user_ID')->map(fn ($value): int => (int) $value)->all();
        $users = User::query()
            ->where('active', true)
            ->where(function ($query) use ($explicit): void {
                $query->where('jobtitle', 'like', '%Strategic Intelligence%');
                if ($explicit !== []) {
                    $query->orWhereIn('ID', $explicit);
                }
            })
            ->orderBy('lastname')
            ->orderBy('firstname')
            ->get();

        $list = [];
        foreach ($users as $person) {
            $isExplicit = in_array((int) $person->ID, $explicit, true);
            $isSih = $this->isSihJobTitle((string) ($person->jobtitle ?? ''));
            $list[] = [
                'user_id' => (int) $person->ID,
                'name' => $person->displayName(),
                'initials' => $person->initials,
                'jobtitle' => (string) ($person->jobtitle ?? ''),
                'source' => $isSih && ! $isExplicit ? 'sih' : 'added',
                'removable' => $isExplicit,
            ];
        }

        return $list;
    }

    /**
     * @return array{editors: list<array<string, mixed>>, board: array<string, mixed>}
     */
    public function addEditor(User $user, string $username): array
    {
        $this->assertManager($user);
        $username = trim($username);
        $person = $username === ''
            ? null
            : User::query()->where('active', true)->whereRaw('LOWER(username) = ?', [mb_strtolower($username)])->first();
        if ($person === null) {
            throw ValidationException::withMessages(['username' => 'No active MERKURflow user has that email.']);
        }
        if ($this->isSihJobTitle((string) ($person->jobtitle ?? ''))) {
            throw ValidationException::withMessages(['username' => 'That person can already edit because they are on the SIH team.']);
        }

        SihRoadmapEditor::query()->firstOrCreate(
            ['user_ID' => $person->ID],
            ['created_by' => $user->ID],
        );
        $this->editCache = [];

        return $this->editorsResult($user);
    }

    /**
     * @return array{editors: list<array<string, mixed>>, board: array<string, mixed>}
     */
    public function removeEditor(User $user, int $userId): array
    {
        $this->assertManager($user);
        SihRoadmapEditor::query()->where('user_ID', $userId)->delete();
        $this->editCache = [];

        return $this->editorsResult($user);
    }

    /**
     * @return array{editors: list<array<string, mixed>>, board: array<string, mixed>}
     */
    public function editorsResult(User $user): array
    {
        $this->assertManager($user);

        return [
            'editors' => $this->editors(),
            'board' => $this->board($user),
        ];
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

    private function quarterLabel(int $year, int $quarter): string
    {
        return 'Q'.$quarter.' '.$year;
    }

    private function quarterStart(int $year, int $quarter): string
    {
        return CarbonImmutable::create($year, (($quarter - 1) * 3) + 1, 1)->toDateString();
    }

    private function quarterEnd(int $year, int $quarter): string
    {
        return CarbonImmutable::create($year, $quarter * 3, 1)->endOfMonth()->toDateString();
    }

    private function quarterRow(int $year, int $quarter): SihRoadmapQuarter
    {
        $row = SihRoadmapQuarter::query()->where('year', $year)->where('quarter', $quarter)->first();
        if ($row === null) {
            throw ValidationException::withMessages(['quarter' => 'That quarter is not on the roadmap.']);
        }

        return $row;
    }

    private function quarterIsEmpty(int $year, int $quarter): bool
    {
        return ! SihRoadmapMilestone::query()->where('year', $year)->where('quarter', $quarter)->exists();
    }

    private function isSihJobTitle(string $jobtitle): bool
    {
        return stripos($jobtitle, 'Strategic Intelligence') !== false;
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
            'target_date' => $milestone->target_date?->format('Y-m-d'),
            'is_hidden' => (bool) $milestone->is_hidden,
            'can_delete' => $this->canDelete($user),
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

    private function assertManager(User $user): void
    {
        if (! $this->mayManageEditors($user)) {
            throw new AuthorizationException('Only a superuser can change who edits the roadmap.');
        }
    }

    /** Any editor may delete (same as the original board). */
    private function canDelete(User $user): bool
    {
        return $this->canEdit($user);
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
