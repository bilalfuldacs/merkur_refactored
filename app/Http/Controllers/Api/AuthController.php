<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('username', $credentials['username'])
            ->where('active', 1)
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->getAuthPassword())) {
            return response()->json([
                'message' => 'These credentials do not match our records.',
            ], 401);
        }

        $token = $user->createToken('api')->plainTextToken;

        $user->logins()->create([
            'IP' => $request->ip() ?? '0.0.0.0',
            'agent' => Str::limit((string) $request->userAgent(), 512, ''),
        ]);

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user->load('role')),
        ]);
    }

    public function show(Request $request): UserResource
    {
        return new UserResource($request->user()->load('role'));
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        $stakes = $user->jurisdictionStakes()
            ->with('jurisdiction')
            ->get()
            ->sortBy(fn ($stake) => mb_strtolower((string) ($stake->jurisdiction?->name_english ?? '')))
            ->values()
            ->map(fn ($stake) => [
                'jurisdiction_ID' => $stake->jurisdiction_ID,
                'iso3166' => $stake->jurisdiction?->iso3166,
                'segment_name' => $stake->jurisdiction?->segment_name,
                'flag' => $stake->jurisdiction?->flag,
                'as_deputy' => (bool) $stake->as_deputy,
            ]);

        $logins = $user->logins()
            ->orderByDesc('when')
            ->limit(10)
            ->get(['when', 'IP', 'agent'])
            ->map(fn ($login) => [
                'when' => $login->when?->utc()->format('Y-m-d H:i:s'),
                'IP' => $login->IP,
                'agent' => $login->agent,
            ]);

        return response()->json([
            'user' => (new UserResource($user))->resolve($request),
            'stakes' => $stakes,
            'logins' => $logins,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'decolorize_avatars' => ['sometimes', 'boolean'],
            'jobtitle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'bcolor' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'color' => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'notifications' => ['sometimes', 'string', 'in:off,daily,weekly'],
        ]);

        $user = $request->user();
        $user->fill($data);
        $user->save();

        return response()->json([
            'user' => (new UserResource($user->load('role')))->resolve($request),
        ]);
    }

    public function password(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'max:50', 'confirmed', 'regex:/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])\S{10,}$/'],
        ], [
            'password.regex' => 'The new password must be at least 10 characters and include a lowercase letter, an uppercase letter, and a digit.',
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->getAuthPassword())) {
            return response()->json([
                'message' => 'The current password you entered does not match.',
            ], 422);
        }

        $user->password = Hash::make($data['password']);
        $user->save();

        return response()->json([
            'message' => 'Password changed.',
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(status: 204);
    }
}
