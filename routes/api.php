<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommunityCommentController;
use App\Http\Controllers\Api\CommunityPostController;
use App\Http\Controllers\Api\FeedbackSubmissionController;
use App\Http\Controllers\Api\FocusGroupsReportController;
use App\Http\Controllers\Api\GlobalSearchController;
use App\Http\Controllers\Api\HomeDashboardController;
use App\Http\Controllers\Api\Ice2027AdminController;
use App\Http\Controllers\Api\Ice2027Controller;
use App\Http\Controllers\Api\InstallationReportController;
use App\Http\Controllers\Api\IssuesReportController;
use App\Http\Controllers\Api\LatestChangesController;
use App\Http\Controllers\Api\MarsApiController;
use App\Http\Controllers\Api\ReportsCatalogController;
use App\Http\Controllers\Api\MerkuriosityController;
use App\Http\Controllers\Api\MerkuriosityDictionaryController;
use App\Http\Controllers\Api\MerkuriosityWordController;
use App\Http\Controllers\Api\OnlineUserController;
use App\Http\Controllers\Api\MarketReportController;
use App\Http\Controllers\Api\PeopleMarketsController;
use App\Http\Controllers\Api\ProductGamesListController;
use App\Http\Controllers\Api\ProductPanoramaController;
use App\Http\Controllers\Api\RoadmapController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ScoutEventController;
use App\Http\Controllers\Api\StaticDocController;
use App\Http\Controllers\Api\StaticFaqController;
use App\Http\Controllers\Api\TableAssetsController;
use App\Http\Controllers\Api\VirtualAssetsController;
use App\Http\Controllers\Api\TableRowsController;
use App\Http\Controllers\Api\TasksController;
use App\Http\Controllers\Api\TablesCatalogController;
use App\Http\Controllers\Api\TableViewSchemaController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'store']);

Route::prefix('mars')->middleware(\App\Http\Middleware\AuthenticateMarsToken::class)->group(function () {
    Route::get('/', [MarsApiController::class, 'index']);
    Route::get('business-partners', [MarsApiController::class, 'businessPartners']);
    Route::get('venues', [MarsApiController::class, 'venues']);
    Route::get('versions', [MarsApiController::class, 'versions']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'show']);
    Route::get('/me/profile', [AuthController::class, 'profile']);
    Route::patch('/me', [AuthController::class, 'update']);
    Route::post('/me/password', [AuthController::class, 'password']);
    Route::post('/logout', [AuthController::class, 'destroy']);
    Route::get('/people-markets', [PeopleMarketsController::class, 'index']);
    Route::get('/people-markets/report', [MarketReportController::class, 'show']);
    Route::get('/online-users', [OnlineUserController::class, 'index']);
    Route::get('/home-dashboard', [HomeDashboardController::class, 'index']);
    Route::get('/search', [GlobalSearchController::class, 'index']);
    Route::get('/reports-catalog', [ReportsCatalogController::class, 'index']);
    Route::get('/reports/latest-changes', [LatestChangesController::class, 'index']);
    Route::get('/reports/installations', [InstallationReportController::class, 'show']);
    Route::get('/reports/focus-groups', [FocusGroupsReportController::class, 'show']);
    Route::get('/reports/issues', [IssuesReportController::class, 'show']);
    Route::get('/tasks', [TasksController::class, 'index']);
    Route::get('/tables-catalog', [TablesCatalogController::class, 'index']);
    Route::get('/tables/{table}/view', [TableViewSchemaController::class, 'show'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*');
    Route::get('/tables/{table}/export', [TableRowsController::class, 'export'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*');
    Route::get('/tables/{table}/lookups', [TableRowsController::class, 'lookups'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*');
    Route::get('/tables/{table}/rows', [TableRowsController::class, 'index'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*');
    Route::post('/tables/{table}/rows', [TableRowsController::class, 'store'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*');
    Route::get('/tables/{table}/rows/{id}/history', [TableRowsController::class, 'history'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*')
        ->whereNumber('id');
    Route::get('/virtual-tables/{table}/assets', [VirtualAssetsController::class, 'index'])
        ->where('table', 'roadmap');
    Route::post('/virtual-tables/{table}/assets', [VirtualAssetsController::class, 'store'])
        ->where('table', 'roadmap');
    Route::patch('/virtual-tables/{table}/assets', [VirtualAssetsController::class, 'update'])
        ->where('table', 'roadmap');
    Route::get('/virtual-tables/{table}/assets/file', [VirtualAssetsController::class, 'show'])
        ->where('table', 'roadmap');
    Route::get('/tables/{table}/rows/{id}/assets', [TableAssetsController::class, 'index'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*')
        ->whereNumber('id');
    Route::post('/tables/{table}/rows/{id}/assets', [TableAssetsController::class, 'store'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*')
        ->whereNumber('id');
    Route::patch('/tables/{table}/rows/{id}/assets', [TableAssetsController::class, 'update'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*')
        ->whereNumber('id');
    Route::get('/tables/{table}/rows/{id}/assets/file', [TableAssetsController::class, 'show'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*')
        ->whereNumber('id');
    Route::get('/tables/{table}/rows/{id}', [TableRowsController::class, 'show'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*')
        ->whereNumber('id');
    Route::patch('/tables/{table}/rows/{id}', [TableRowsController::class, 'update'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*')
        ->whereNumber('id');
    Route::delete('/tables/{table}/rows/{id}', [TableRowsController::class, 'destroy'])
        ->where('table', '[A-Za-z_][A-Za-z0-9_]*')
        ->whereNumber('id');

    Route::apiResource('users', UserController::class);
    Route::apiResource('roles', RoleController::class);
    Route::get('products/panorama', [ProductPanoramaController::class, 'index']);
    Route::get('products/panorama/{version}', [ProductPanoramaController::class, 'show']);
    Route::get('products/games-list/{version}', [ProductGamesListController::class, 'show'])
        ->whereNumber('version');
    Route::get('roadmap', [RoadmapController::class, 'index']);
    Route::get('help/faqs', [StaticFaqController::class, 'help']);
    Route::apiResource('static-faqs', StaticFaqController::class)
        ->parameters(['static-faqs' => 'staticFaq']);
    Route::get('community/mentionables', [CommunityPostController::class, 'mentionables']);
    Route::apiResource('community-posts', CommunityPostController::class)
        ->parameters(['community-posts' => 'dynamicPost']);
    Route::post('community-posts/{dynamicPost}/like', [CommunityPostController::class, 'toggleLike']);
    Route::post('community-posts/{dynamicPost}/dislike', [CommunityPostController::class, 'toggleDislike']);
    Route::post('community-posts/{dynamicPost}/bookmark', [CommunityPostController::class, 'toggleBookmark']);
    Route::get('community-posts/{dynamicPost}/likes', [CommunityPostController::class, 'likes']);
    Route::get('community-posts/{dynamicPost}/dislikes', [CommunityPostController::class, 'dislikes']);
    Route::apiResource('community-posts.comments', CommunityCommentController::class)
        ->parameters([
            'community-posts' => 'dynamicPost',
            'comments' => 'dynamicComment',
        ]);
    Route::post('static-docs/{staticDoc}', [StaticDocController::class, 'update'])
        ->whereNumber('staticDoc');
    Route::apiResource('static-docs', StaticDocController::class)
        ->parameters(['static-docs' => 'staticDoc']);
    Route::get('static-docs/{staticDoc}/thumbnail', [StaticDocController::class, 'thumbnail']);
    Route::get('static-docs/{staticDoc}/pdf', [StaticDocController::class, 'pdf']);
    Route::get('feedback-submissions/{feedbackSubmission}/screenshot', [FeedbackSubmissionController::class, 'screenshot'])
        ->whereNumber('feedbackSubmission');
    Route::apiResource('feedback-submissions', FeedbackSubmissionController::class)
        ->parameters(['feedback-submissions' => 'feedbackSubmission']);
    Route::get('merkuriosity/daily-word', [MerkuriosityController::class, 'dailyWord']);
    Route::post('merkuriosity/guess', [MerkuriosityController::class, 'guess']);
    Route::apiResource('merkuriosity/words', MerkuriosityWordController::class)
        ->parameters(['words' => 'merkuriosityWord']);
    Route::apiResource('merkuriosity/dictionary', MerkuriosityDictionaryController::class)
        ->parameters(['dictionary' => 'merkuriosityDictionary']);

    Route::get('scout/events', [ScoutEventController::class, 'menu']);
    Route::get('scout/admin/events', [ScoutEventController::class, 'index']);
    Route::post('scout/admin/events', [ScoutEventController::class, 'store']);
    Route::patch('scout/admin/events/{event}', [ScoutEventController::class, 'update']);

    Route::get('ice2027', [Ice2027Controller::class, 'bootstrap']);
    Route::get('ice2027/questionnaire/{competitor}', [Ice2027Controller::class, 'questionnaire'])
        ->whereNumber('competitor');
    Route::put('ice2027/questionnaire/{competitor}', [Ice2027Controller::class, 'saveQuestionnaire'])
        ->whereNumber('competitor');
    Route::get('ice2027/evaluation', [Ice2027Controller::class, 'evaluation']);
    Route::put('ice2027/evaluation', [Ice2027Controller::class, 'saveEvaluation']);
    Route::get('ice2027/dashboard', [Ice2027Controller::class, 'dashboard']);
    Route::get('ice2027/progress', [Ice2027Controller::class, 'progress']);
    Route::get('ice2027/photo', [Ice2027Controller::class, 'photo']);
    Route::post('ice2027/photo', [Ice2027Controller::class, 'uploadPhoto']);
    Route::post('ice2027/photo/delete', [Ice2027Controller::class, 'deletePhoto']);
    Route::get('ice2027/admin', [Ice2027AdminController::class, 'show']);
    Route::post('ice2027/admin/reminders', [Ice2027AdminController::class, 'sendReminders']);
    Route::put('ice2027/admin/attendants', [Ice2027AdminController::class, 'saveAttendants']);
    Route::patch('ice2027/admin/attendants/{user}', [Ice2027AdminController::class, 'setAttendant'])
        ->whereNumber('user');
    Route::patch('ice2027/admin/teams/{team}', [Ice2027AdminController::class, 'renameTeam'])
        ->whereNumber('team');
    Route::put('ice2027/admin/teams/{team}/members', [Ice2027AdminController::class, 'setMembers'])
        ->whereNumber('team');
    Route::post('ice2027/admin/competitors', [Ice2027AdminController::class, 'storeCompetitor']);
    Route::patch('ice2027/admin/competitors/{competitor}', [Ice2027AdminController::class, 'updateCompetitor'])
        ->whereNumber('competitor');
    Route::delete('ice2027/admin/competitors/{competitor}', [Ice2027AdminController::class, 'destroyCompetitor'])
        ->whereNumber('competitor');
    Route::post('ice2027/admin/games', [Ice2027AdminController::class, 'storeGame']);
    Route::patch('ice2027/admin/games/{game}', [Ice2027AdminController::class, 'updateGame'])
        ->whereNumber('game');
    Route::delete('ice2027/admin/games/{game}', [Ice2027AdminController::class, 'destroyGame'])
        ->whereNumber('game');
});
