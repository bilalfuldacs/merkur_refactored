<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductPanoramaResource;
use App\Models\Version;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductPanoramaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $scope = $this->scope($request);

        $query = Version::query()
            ->with(Version::panoramaEagerLoads())
            ->withCount(['focusGroups', 'installations']);

        match ($scope) {
            'inactive' => $query
                ->where('status_ID', '<=', 199)
                ->orderBy('status_ID')
                ->orderBy('platform_ID')
                ->orderByDesc('name_SORT'),
            'preparing' => $query
                ->whereBetween('status_ID', [200, 599])
                ->orderByDesc('status_ID')
                ->orderBy('platform_ID')
                ->orderBy('name_SORT'),
            'discontinued' => $query
                ->where('status_ID', '>=', 700)
                ->orderBy('status_ID')
                ->orderBy('platform_ID')
                ->orderByDesc('name_SORT'),
            default => $query
                ->whereBetween('status_ID', [600, 699])
                ->orderBy('status_ID')
                ->orderBy('platform_ID')
                ->orderByDesc('name_SORT'),
        };

        if ($request->filled('platform_ID')) {
            $query->where('platform_ID', $request->integer('platform_ID'));
        }

        return ProductPanoramaResource::collection($query->get())
            ->additional([
                'meta' => [
                    'scope' => $scope,
                ],
            ]);
    }

    public function show(Version $version): ProductPanoramaResource
    {
        $version->load(Version::panoramaEagerLoads())
            ->loadCount(['focusGroups', 'installations']);

        return new ProductPanoramaResource($version);
    }

    private function scope(Request $request): string
    {
        $scope = $request->string('scope')->toString() ?: 'available';

        return in_array($scope, ['inactive', 'preparing', 'available', 'discontinued'], true)
            ? $scope
            : 'available';
    }
}
