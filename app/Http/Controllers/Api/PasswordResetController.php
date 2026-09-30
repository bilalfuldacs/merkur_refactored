<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PasswordResetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Throwable;

class PasswordResetController extends Controller
{
    public function __construct(private PasswordResetService $resets) {}

    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:50'],
        ]);

        try {
            $this->resets->request($data['email'], $request->ip());
        } catch (Throwable) {
            return response()->json([
                'message' => 'The reset email could not be sent. Please try again, or contact Bilal or Moritz.',
            ], 500);
        }

        return response()->json([
            'message' => 'If that address belongs to an active account, a reset link is on its way. It expires in one hour.',
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        $token = (string) $request->query('token', '');
        if (! $this->resets->tokenIsValid($token)) {
            return response()->json([
                'valid' => false,
                'message' => 'This reset link is invalid or has expired. Request a new one.',
            ]);
        }

        return response()->json(['valid' => true]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'max:50', 'confirmed', 'regex:'.PasswordResetService::PASSWORD_REGEX],
        ], [
            'password.regex' => 'The new password must be at least 10 characters and include a lowercase letter, an uppercase letter, and a digit.',
        ]);

        try {
            $ok = $this->resets->complete($data['token'], $data['password']);
        } catch (InvalidArgumentException) {
            return response()->json(['message' => 'The new password does not meet the rules.'], 422);
        }

        if (! $ok) {
            return response()->json([
                'message' => 'This reset link is invalid or has expired. Request a new one.',
            ], 422);
        }

        return response()->json(['message' => 'Your password has been saved. You can sign in now.']);
    }
}
