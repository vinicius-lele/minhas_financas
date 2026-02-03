<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BudgetsController;
use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\InvestmentsController;
use App\Http\Controllers\ProfilesController;
use App\Http\Controllers\PurchaseGoalsController;
use App\Http\Controllers\SummaryController;
use App\Http\Controllers\TransactionsController;
use Illuminate\Support\Facades\Route;

Route::prefix('api/auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::prefix('api')->middleware(['auth.token'])->group(function () {
    Route::get('/profiles', [ProfilesController::class, 'index']);
    Route::post('/profiles', [ProfilesController::class, 'store']);
    Route::put('/profiles/{id}', [ProfilesController::class, 'update']);
    Route::delete('/profiles/{id}', [ProfilesController::class, 'destroy']);

    Route::middleware(['profile'])->group(function () {
        Route::get('/categories', [CategoriesController::class, 'index']);
        Route::post('/categories', [CategoriesController::class, 'store']);
        Route::put('/categories/{id}', [CategoriesController::class, 'update']);
        Route::delete('/categories/{id}', [CategoriesController::class, 'destroy']);

        Route::get('/transactions', [TransactionsController::class, 'index']);
        Route::post('/transactions', [TransactionsController::class, 'store']);
        Route::put('/transactions/{id}', [TransactionsController::class, 'update']);
        Route::delete('/transactions/{id}', [TransactionsController::class, 'destroy']);

        Route::get('/summary', [SummaryController::class, 'index']);
        Route::get('/summary/categories', [SummaryController::class, 'byCategory']);
        Route::get('/summary/monthly', [SummaryController::class, 'monthly']);
        Route::get('/summary/annual', [SummaryController::class, 'annual']);

        Route::get('/purchase-goals', [PurchaseGoalsController::class, 'index']);
        Route::post('/purchase-goals', [PurchaseGoalsController::class, 'store']);
        Route::put('/purchase-goals/{id}', [PurchaseGoalsController::class, 'update']);
        Route::delete('/purchase-goals/{id}', [PurchaseGoalsController::class, 'destroy']);
        Route::post('/purchase-goals/{id}/complete', [PurchaseGoalsController::class, 'complete']);
        Route::post('/purchase-goals/{id}/savings', [PurchaseGoalsController::class, 'addSaving']);
        Route::get('/purchase-goals/{id}/savings', [PurchaseGoalsController::class, 'listSavings']);
        Route::get('/purchase-goals/summary', [PurchaseGoalsController::class, 'summary']);

        Route::get('/budgets', [BudgetsController::class, 'index']);
        Route::post('/budgets', [BudgetsController::class, 'store']);
        Route::put('/budgets/{id}', [BudgetsController::class, 'update']);
        Route::delete('/budgets/{id}', [BudgetsController::class, 'destroy']);
        Route::get('/budgets/summary', [BudgetsController::class, 'summary']);

        Route::get('/investments', [InvestmentsController::class, 'index']);
        Route::post('/investments', [InvestmentsController::class, 'store']);
        Route::put('/investments/{id}', [InvestmentsController::class, 'update']);
        Route::delete('/investments/{id}', [InvestmentsController::class, 'destroy']);
        Route::get('/investments/summary', [InvestmentsController::class, 'summary']);
    });
});
