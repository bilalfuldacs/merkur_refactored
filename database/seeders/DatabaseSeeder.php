<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DummyRoleSeeder::class,
            DummyUserSeeder::class,
            DummyPlatformSeeder::class,
            DummyTeamSeeder::class,
            DummyPartnerSeeder::class,
            DummyHardwareTypeSeeder::class,
            DummyComponentSeeder::class,
            DummyCabinetSeeder::class,
            DummyAuthoritySeeder::class,
            DummyJurisdictionSeeder::class,
            DummyMarketSeeder::class,
            DummyGameConceptSeeder::class,
            DummyMatrixTemplateSeeder::class,
            DummyStakeJurisdictionSeeder::class,
            DummyVenueSeeder::class,
            DummyPartnerActivitySeeder::class,
            DummyConfigurationSeeder::class,
            DummyConfigTableSeeder::class,
            DummyConfigStatusSeeder::class,
            DummyResolutionSeeder::class,
            DummyConfigReportSeeder::class,
            DummyConfigEntitlementSeeder::class,
            DummyCiSupplierSeeder::class,
            DummyStratDomainSeeder::class,
            DummyStratFeatureSeeder::class,
            DummyStaticFaqSeeder::class,
            DummyStaticDocSeeder::class,
            DummyFeedbackSubmissionSeeder::class,
            DummyMerkuriosityDictionarySeeder::class,
            DummyMerkuriosityWordSeeder::class,
            DummyDynamicLoginSeeder::class,
            DummyWatchedItemSeeder::class,
            DummyDevTestSeeder::class,
            DummyDynamicPostSeeder::class,
            DummyDynamicLikeSeeder::class,
            DummyDynamicBookmarkSeeder::class,
            DummyConfigTableViewPresetSeeder::class,
            DummyVersionSeeder::class,
            DummyGameSeeder::class,
            DummyGameReuseSeeder::class,
            DummyFeatureSeeder::class,
            DummyBuildSeeder::class,
            DummyDongleSeeder::class,
            DummyDefectSeeder::class,
            DummyVersionMilestoneSeeder::class,
            DummyBuildMilestoneSeeder::class,
            DummyGameMilestoneSeeder::class,
            DummyAvailabilitySeeder::class,
            DummyCompatibilitySeeder::class,
            DummySoftwareReleaseSeeder::class,
            DummyInstallationSeeder::class,
            DummyFocusGroupSeeder::class,
            DummyIce2027Seeder::class,
        ]);
    }
}
