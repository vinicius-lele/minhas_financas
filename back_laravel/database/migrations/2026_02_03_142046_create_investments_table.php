<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('investments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('profile_id');
            $table->string('name', 255);
            $table->string('category', 120)->nullable();
            $table->string('broker', 120)->nullable();
            $table->decimal('invested_amount', 12, 2);
            $table->decimal('current_value', 12, 2);
            $table->dateTime('created_at');
            $table->dateTime('updated_at');

            $table->foreign('profile_id')->references('id')->on('profiles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investments');
    }
};
