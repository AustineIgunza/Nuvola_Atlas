<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Atlas'));
Route::get('/atlas', fn () => Inertia::render('Atlas'));
Route::get('/vitality', fn () => Inertia::render('Vitality'));
Route::get('/infrastructure/{id?}', fn () => Inertia::render('Infrastructure'));
Route::get('/reports', fn () => Inertia::render('Reports'));
Route::get('/alerts', fn () => Inertia::render('Alerts'));
Route::get('/sign-in', fn () => Inertia::render('SignIn'));
Route::get('/sign-up', fn () => Inertia::render('SignUp'));
