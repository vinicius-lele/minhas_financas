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
        Schema::create('revoked_tokens', function (Blueprint $table) {
            $table->string('jti', 128)->primary();
            $table->unsignedBigInteger('user_id');
            $table->dateTime('expires_at');
            $table->dateTime('created_at');

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('revoked_tokens');
    }
};
