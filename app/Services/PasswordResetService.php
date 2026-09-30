<?php

namespace App\Services;

use App\Models\DynamicPasswordReset;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use InvalidArgumentException;

class PasswordResetService
{
    public const TOKEN_TTL_SECONDS = 3600;

    public const MAX_REQUESTS_PER_HOUR = 3;

    public const PASSWORD_MAX_LENGTH = 50;

    public const PASSWORD_REGEX = '/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])\S{10,}$/';

    public function request(string $email, ?string $ip): void
    {
        $email = trim($email);
        DynamicPasswordReset::query()
            ->where('expires_at', '<', now('UTC')->subDay())
            ->delete();

        $user = User::query()
            ->where('username', $email)
            ->where('active', 1)
            ->first();
        if ($user === null || filter_var((string) $user->username, FILTER_VALIDATE_EMAIL) === false) {
            hash('sha256', random_bytes(32));

            return;
        }

        $recent = DynamicPasswordReset::query()
            ->where('user_ID', $user->ID)
            ->where('created_at', '>=', now('UTC')->subHour())
            ->count();
        if ($recent >= self::MAX_REQUESTS_PER_HOUR) {
            return;
        }

        $token = bin2hex(random_bytes(32));
        DynamicPasswordReset::query()
            ->where('user_ID', $user->ID)
            ->whereNull('used_at')
            ->update(['used_at' => now('UTC')]);

        DynamicPasswordReset::query()->create([
            'user_ID' => $user->ID,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now('UTC')->addSeconds(self::TOKEN_TTL_SECONDS),
            'created_at' => now('UTC'),
            'request_ip' => $ip !== null ? mb_substr($ip, 0, 45) : null,
        ]);

        $this->sendMail((string) $user->username, (string) ($user->firstname ?? ''), $this->resetUrl($token));
    }

    public function tokenIsValid(string $token): bool
    {
        return $this->findRow($token) !== null;
    }

    public function complete(string $token, string $password): bool
    {
        if (! $this->passwordAllowed($password)) {
            throw new InvalidArgumentException('password');
        }

        return DB::transaction(function () use ($token, $password) {
            $row = $this->findRow($token, true);
            if ($row === null) {
                return false;
            }
            $user = User::query()->where('ID', $row->user_ID)->where('active', 1)->lockForUpdate()->first();
            if ($user === null) {
                return false;
            }
            $user->password = Hash::make($password);
            $user->save();
            DynamicPasswordReset::query()
                ->where('user_ID', $user->ID)
                ->whereNull('used_at')
                ->update(['used_at' => now('UTC')]);

            return true;
        });
    }

    public function passwordAllowed(string $password): bool
    {
        return strlen($password) <= self::PASSWORD_MAX_LENGTH
            && preg_match(self::PASSWORD_REGEX, $password) === 1;
    }

    private function findRow(string $token, bool $lock = false): ?DynamicPasswordReset
    {
        $hash = $this->tokenHash($token);
        if ($hash === null) {
            return null;
        }
        $query = DynamicPasswordReset::query()
            ->where('token_hash', $hash)
            ->whereNull('used_at')
            ->where('expires_at', '>', now('UTC'));
        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function tokenHash(string $token): ?string
    {
        if (preg_match('/\A[a-f0-9]{64}\z/', $token) !== 1) {
            return null;
        }

        return hash('sha256', $token);
    }

    private function resetUrl(string $token): string
    {
        $base = rtrim((string) config('app.url'), '/');

        return $base.'/reset-password?token='.$token;
    }

    private function sendMail(string $email, string $firstname, string $url): void
    {
        $name = $firstname !== '' ? $firstname : 'there';
        $subject = 'MERKURflow: reset your password';
        $html = '<p>Hello '.e($name).',</p>'
            .'<p>We received a request to reset the password for this MERKURflow account. The link below is valid for one hour and can be used once.</p>'
            .'<p><a href="'.e($url).'">Choose a new password</a></p>'
            .'<p>If you did not ask for this, you can ignore this message. Your password will stay the same.</p>';
        Mail::html($html, function ($message) use ($email, $subject) {
            $message->to($email)->subject($subject);
        });
    }
}
