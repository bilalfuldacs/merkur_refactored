<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'submitter_name',
    'submitter_email',
    'department',
    'feedback_type',
    'related_area',
    'subject',
    'description',
    'expected_impact',
    'priority',
    'attachment_path',
    'status',
    'submitted_at',
    'reviewed_at',
    'reviewed_by',
])]
class FeedbackSubmission extends Model
{
    public const DEPARTMENTS = [
        'Product Management',
        'R&D',
        'Sales',
        'Market Research',
        'Data Analytics',
        'Support',
        'Operations',
        'C-Level Suite',
        'Other',
    ];

    public const TYPES = [
        'Improvement Suggestion',
        'New Feature Request',
        'Bug Report / Issue',
        'Usability Feedback',
        'Performance Suggestion',
        'General Comment',
    ];

    /** @var array<string, string> */
    public const UX_TYPES = [
        'improvement' => 'Improvement Suggestion',
        'problem' => 'Bug Report / Issue',
        'idea' => 'New Feature Request',
    ];

    public const AREAS = [
        'General',
        'Products',
        'Roadmap',
        'People & Markets',
        'Community',
        'Docs',
        'Help',
        'Tables',
        'Home',
    ];

    public const PRIORITIES = ['low', 'medium', 'high', 'critical'];

    public const STATUSES = [
        'new',
        'under_review',
        'planned',
        'in_progress',
        'completed',
        'declined',
    ];

    protected $primaryKey = 'id';

    public $timestamps = false;

    public function getRouteKeyName(): string
    {
        return 'id';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mod_by', 'ID');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by', 'ID');
    }

    public function typeKey(): string
    {
        $stored = (string) $this->feedback_type;
        if (array_key_exists($stored, self::UX_TYPES)) {
            return $stored;
        }

        $fromLabel = array_search($stored, self::UX_TYPES, true);
        if (is_string($fromLabel)) {
            return $fromLabel;
        }

        return match ($stored) {
            'enhancement', 'Usability Feedback', 'Performance Suggestion' => 'improvement',
            'bug' => 'problem',
            'General Comment' => 'idea',
            default => 'improvement',
        };
    }

    public function typeLabel(): string
    {
        return match ($this->typeKey()) {
            'problem' => 'Problem',
            'idea' => 'New idea',
            default => 'Improvement',
        };
    }

    public function reference(): string
    {
        $date = $this->submitted_at?->format('Ymd') ?? date('Ymd');

        return 'FB-'.$date.'-'.str_pad((string) $this->id, 5, '0', STR_PAD_LEFT);
    }

    public static function storedType(?string $value): string
    {
        $raw = trim((string) $value);
        if (array_key_exists($raw, self::UX_TYPES)) {
            return self::UX_TYPES[$raw];
        }

        return in_array($raw, self::TYPES, true) ? $raw : self::UX_TYPES['improvement'];
    }
}
