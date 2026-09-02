<?php

namespace Database\Seeders;

use App\Models\StaticFaq;
use App\Models\User;
use Illuminate\Database\Seeder;

class DummyStaticFaqSeeder extends Seeder
{
    public function run(): void
    {
        $editor = User::query()->where('username', 'admin@dummy.test')->firstOrFail();

        $faqs = [
            [100, 'Dummy: What does MERKURflow do?', 'MERKURflow tracks games, versions, markets, and hardware from concept to release.'],
            [110, 'Dummy: How do Versions and Builds go into the Products panorama and the Roadmap?', 'A Version is the abstract product. A Build is a deliverable package of that Version for a jurisdiction.'],
            [120, 'Dummy: What other tables exist in MERKURflow?', 'The catalog in config__tables lists every product, market, partner, CI, and system table.'],
            [130, 'Dummy: What are Statuses for Versions and Builds?', 'Statuses describe where a Version or Build sits in the pipeline, from requested through released to EOL.'],
            [140, 'Dummy: What are TLP levels?', 'TLP controls how sensitive a record is. Red is restricted to roles that may use TLP-red.'],
            [150, 'Dummy: What are Roles and Entitlements?', 'Roles carry permission flags. Entitlements can further limit which tables a role may use.'],
            [160, 'Dummy: What are NULL and EMPTY values?', 'NULL means not set. EMPTY means the user cleared a value on purpose.'],
            [800, 'Dummy: Tips & Tricks', 'Use the launchpad for frequent tables and check Latest Changes after a busy day.'],
            [900, 'Dummy: How do I add MERKURflow to my phone’s Home Screen?', 'Open the app in the browser and use Add to Home Screen.'],
            [910, 'Dummy: How does MERKURflow evolve?', 'New tables and reports are added as the product catalog grows.'],
        ];
        foreach ($faqs as [$order, $title, $article]) {
            $faq = StaticFaq::query()->firstOrNew(['title' => $title]);
            $faq->setAttribute('order', $order);
            $faq->article = $article;
            $faq->mod_by = $editor->ID;
            $faq->save();
        }
    }
}
