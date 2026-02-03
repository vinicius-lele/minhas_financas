<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $count = DB::table('profiles')->count();
        if ($count === 0) {
            DB::table('profiles')->insert([
                'id' => 1,
                'name' => 'Padrão',
                'theme' => 'blue',
            ]);
        }
    }
}
