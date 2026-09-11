<?php

require_once __DIR__ . '/../includes/proteger.php';
require_once __DIR__ . '/../../config/banco.php';

header('Content-Type: application/json; charset=utf-8');

$categoriaId = filter_input(INPUT_GET, 'categoria_id', FILTER_VALIDATE_INT);

if (!$categoriaId) {
    http_response_code(400);
    echo json_encode([
        'erro' => 'Categoria inválida.'
    ]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT id, nome
    FROM subcategorias
    WHERE categoria_id = :categoria_id
      AND ativo = 1
    ORDER BY nome ASC
");

$stmt->execute([
    ':categoria_id' => $categoriaId
]);

echo json_encode(
    $stmt->fetchAll(),
    JSON_UNESCAPED_UNICODE
);