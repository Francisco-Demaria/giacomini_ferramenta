<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

try {
    /* A configuração vive apenas na Hostinger e deve fornecer $pdo. */
    require_once __DIR__ . '/../config/banco.php';

    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('Conexão com o catálogo indisponível.');
    }

    $stmt = $pdo->query(
        "SELECT
            p.sku,
            p.nome,
            p.marca,
            COALESCE(c.nome, '') AS categoria,
            COALESCE(sc.nome, '') AS subcategoria,
            p.preco_vista AS precoVista,
            p.preco_parcelado AS precoParcelado,
            p.descricao,
            p.peso_kg AS pesoKg,
            p.aplicacao,
            p.linha
        FROM produtos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        LEFT JOIN subcategorias sc ON sc.id = p.subcategoria_id
        WHERE p.ativo = 1
        ORDER BY p.nome ASC"
    );

    $produtos = array_map(
        static function (array $produto): array {
            return [
                'sku' => $produto['sku'] ?? '',
                'nome' => $produto['nome'] ?? '',
                'marca' => $produto['marca'] ?? '',
                'categoria' => $produto['categoria'] ?? '',
                'subcategoria' => $produto['subcategoria'] ?? '',
                'precoVista' => $produto['precoVista'] ?? null,
                'precoParcelado' => $produto['precoParcelado'] ?? null,
                'imagem' => '',
                'disponivel' => true,
                'descricao' => $produto['descricao'] ?? '',
                'pesoKg' => $produto['pesoKg'] ?? null,
                'dimensoes' => '',
                'aplicacao' => $produto['aplicacao'] ?? '',
                'linha' => $produto['linha'] ?? ''
            ];
        },
        $stmt->fetchAll(PDO::FETCH_ASSOC)
    );

    echo json_encode($produtos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log('API de produtos: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['erro' => 'Não foi possível carregar o catálogo no momento.'], JSON_UNESCAPED_UNICODE);
}
