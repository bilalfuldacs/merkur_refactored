<?php

namespace App\Support;

use App\Models\Authority;
use App\Models\Availability;
use App\Models\Build;
use App\Models\BuildMilestone;
use App\Models\Cabinet;
use App\Models\CiSupplier;
use App\Models\Compatibility;
use App\Models\Component;
use App\Models\ConfigStatus;
use App\Models\Configuration;
use App\Models\Defect;
use App\Models\Dongle;
use App\Models\Feature;
use App\Models\FocusGroup;
use App\Models\Game;
use App\Models\GameConcept;
use App\Models\GameMilestone;
use App\Models\GameReuse;
use App\Models\HardwareType;
use App\Models\Installation;
use App\Models\Jurisdiction;
use App\Models\MarketLandbased;
use App\Models\MarketOnline;
use App\Models\MatrixTemplate;
use App\Models\Partner;
use App\Models\PartnerActivity;
use App\Models\Platform;
use App\Models\Resolution;
use App\Models\Role;
use App\Models\SoftwareRelease;
use App\Models\StakeJurisdiction;
use App\Models\StaticFaq;
use App\Models\StratDomain;
use App\Models\Team;
use App\Models\User;
use App\Models\Venue;
use App\Models\Version;
use App\Models\VersionMilestone;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;

final class TableResourceMap
{
    /**
     * @var list<class-string<Model>>
     */
    private const MODELS = [
        Authority::class,
        Availability::class,
        Build::class,
        BuildMilestone::class,
        Cabinet::class,
        CiSupplier::class,
        Compatibility::class,
        Component::class,
        ConfigStatus::class,
        Configuration::class,
        Defect::class,
        Dongle::class,
        Feature::class,
        FocusGroup::class,
        Game::class,
        GameConcept::class,
        GameMilestone::class,
        GameReuse::class,
        HardwareType::class,
        Installation::class,
        Jurisdiction::class,
        MarketLandbased::class,
        MarketOnline::class,
        MatrixTemplate::class,
        Partner::class,
        PartnerActivity::class,
        Platform::class,
        Resolution::class,
        Role::class,
        SoftwareRelease::class,
        StakeJurisdiction::class,
        StaticFaq::class,
        StratDomain::class,
        Team::class,
        User::class,
        Venue::class,
        Version::class,
        VersionMilestone::class,
    ];

    /**
     * @var array<string, TableResourceBinding>|null
     */
    private static ?array $byTable = null;

    public static function forSource(string $source): ?TableResourceBinding
    {
        return self::all()[$source] ?? null;
    }

    /**
     * @return array<string, TableResourceBinding>
     */
    public static function all(): array
    {
        if (self::$byTable !== null) {
            return self::$byTable;
        }

        $bindings = [];

        foreach (self::MODELS as $modelClass) {
            $base = class_basename($modelClass);
            $storeRequest = 'App\\Http\\Requests\\Store'.$base.'Request';
            $updateRequest = 'App\\Http\\Requests\\Update'.$base.'Request';

            if (! is_subclass_of($storeRequest, FormRequest::class)
                || ! is_subclass_of($updateRequest, FormRequest::class)) {
                continue;
            }

            /** @var Model $model */
            $model = new $modelClass;
            $bindings[$model->getTable()] = new TableResourceBinding(
                $modelClass,
                lcfirst($base),
                $storeRequest,
                $updateRequest,
            );
        }

        self::$byTable = $bindings;

        return self::$byTable;
    }
}
