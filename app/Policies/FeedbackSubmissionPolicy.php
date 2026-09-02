<?php

namespace App\Policies;

use App\Models\FeedbackSubmission;
use App\Models\User;

class FeedbackSubmissionPolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, FeedbackSubmission $feedbackSubmission): bool
    {
        return $user->isSuperuser() || (int) $feedbackSubmission->mod_by === (int) $user->ID;
    }

    public function update(User $user, FeedbackSubmission $feedbackSubmission): bool
    {
        return $user->isSuperuser();
    }

    public function delete(User $user, FeedbackSubmission $feedbackSubmission): bool
    {
        return $user->isSuperuser();
    }
}
