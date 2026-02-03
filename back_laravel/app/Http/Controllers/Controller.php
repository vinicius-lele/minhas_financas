<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use OpenApi\Attributes as OA;

#[OA\Info(
    title: 'API Minhas Finanças',
    version: '1.0.0',
)]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
)]
#[OA\Server(
    url: 'http://localhost:3333',
    description: 'Servidor local'
)]
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}
