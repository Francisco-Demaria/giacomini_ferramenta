<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    require_once __DIR__ . '/../config/banco.php';

    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('Conexão com o catálogo indisponível.');
    }

    $modo = trim((string)($_GET['modo'] ?? 'produtos'));
    $pagina = max(1, (int)($_GET['pagina'] ?? 1));
    $porPagina = min(48, max(1, (int)($_GET['porPagina'] ?? 24)));

    $busca = trim((string)($_GET['busca'] ?? ''));
    $categoria = trim((string)($_GET['categoria'] ?? ''));
    $subcategoria = trim((string)($_GET['subcategoria'] ?? ''));
    $id = max(0, (int)($_GET['id'] ?? 0));
    $sku = trim((string)($_GET['sku'] ?? ''));

    if ($modo === 'estrutura') {
        $categorias = $pdo->query("
            SELECT
                c.id,
                c.nome,
                c.slug,
                COUNT(p.id) AS total_produtos
            FROM categorias c
            LEFT JOIN produtos p
                ON p.categoria_id = c.id
                AND p.ativo = 1
            WHERE c.ativo = 1
            GROUP BY c.id, c.nome, c.slug
            ORDER BY c.nome ASC
        ")->fetchAll(PDO::FETCH_ASSOC);

        $subcategorias = $pdo->query("
            SELECT
                sc.id,
                sc.nome,
                sc.slug,
                sc.categoria_id,
                COUNT(p.id) AS total_produtos
            FROM subcategorias sc
            LEFT JOIN produtos p
                ON p.subcategoria_id = sc.id
                AND p.ativo = 1
            GROUP BY sc.id, sc.nome, sc.slug, sc.categoria_id
            ORDER BY sc.nome ASC
        ")->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'categorias' => $categorias,
            'subcategorias' => $subcategorias
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $where = ['p.ativo = 1'];
    $params = [];

    if ($busca !== '') {
        $where[] = '(
            p.nome LIKE :busca_nome
            OR p.sku LIKE :busca_sku
            OR p.codigo_makita LIKE :busca_codigo
            OR p.codigo_alternativo LIKE :busca_alternativo
            OR p.descricao LIKE :busca_descricao
        )';

        $termo = '%' . $busca . '%';
        $params[':busca_nome'] = $termo;
        $params[':busca_sku'] = $termo;
        $params[':busca_codigo'] = $termo;
        $params[':busca_alternativo'] = $termo;
        $params[':busca_descricao'] = $termo;
    }

    if ($categoria !== '') {
        $where[] = 'c.slug = :categoria';
        $params[':categoria'] = $categoria;
    }

    if ($subcategoria !== '') {
        $where[] = 'sc.slug = :subcategoria';
        $params[':subcategoria'] = $subcategoria;
    }

    if ($id > 0) {
        $where[] = 'p.id = :id';
        $params[':id'] = $id;
    }

    if ($sku !== '') {
        $where[] = '(p.sku = :sku OR p.codigo_makita = :sku_codigo)';
        $params[':sku'] = $sku;
        $params[':sku_codigo'] = $sku;
    }

    $whereSql = implode(' AND ', $where);

    $select = "
        SELECT
            p.id,
            p.sku,
            p.codigo_makita,
            p.nome,
            p.descricao,
            p.marca,
            p.aplicacao,
            p.linha,
            p.codigo_alternativo,
            p.peso_kg,
            p.ncm,
            p.preco_vista AS precoVista,
            p.preco_parcelado AS precoParcelado,
            COALESCE(e.quantidade, 0) AS estoque,
            c.nome AS categoria,
            c.slug AS categoriaSlug,
            sc.nome AS subcategoria,
            sc.slug AS subcategoriaSlug
        FROM produtos p
        LEFT JOIN categorias c
            ON c.id = p.categoria_id
        LEFT JOIN subcategorias sc
            ON sc.id = p.subcategoria_id
        LEFT JOIN estoque e
            ON e.produto_id = p.id
        WHERE {$whereSql}
    ";

    if ($modo === 'produto') {
        $stmt = $pdo->prepare($select . " ORDER BY p.nome ASC LIMIT 1");

        foreach ($params as $name => $value) {
            $stmt->bindValue($name, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }

        $stmt->execute();
        $produto = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$produto) {
            http_response_code(404);
            echo json_encode([
                'erro' => 'Produto não encontrado.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode([
            'produto' => normalizarProduto($produto)
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $stmtTotal = $pdo->prepare("
        SELECT COUNT(*)
        FROM produtos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        LEFT JOIN subcategorias sc ON sc.id = p.subcategoria_id
        WHERE {$whereSql}
    ");

    foreach ($params as $name => $value) {
        $stmtTotal->bindValue($name, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }

    $stmtTotal->execute();
    $total = (int)$stmtTotal->fetchColumn();

    $offset = ($pagina - 1) * $porPagina;

    $stmt = $pdo->prepare("
        {$select}
        ORDER BY p.nome ASC
        LIMIT :limite OFFSET :offset
    ");

    foreach ($params as $name => $value) {
        $stmt->bindValue($name, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }

    $stmt->bindValue(':limite', $porPagina, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $produtos = array_map(
        'normalizarProduto',
        $stmt->fetchAll(PDO::FETCH_ASSOC)
    );

    $totalPaginas = max(1, (int)ceil($total / $porPagina));

    echo json_encode([
        'produtos' => $produtos,
        'paginacao' => [
            'pagina' => $pagina,
            'porPagina' => $porPagina,
            'total' => $total,
            'totalPaginas' => $totalPaginas,
            'temAnterior' => $pagina > 1,
            'temProxima' => $pagina < $totalPaginas
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    error_log('API de produtos: ' . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        'erro' => 'Não foi possível carregar o catálogo no momento.'
    ], JSON_UNESCAPED_UNICODE);
}

function normalizarProduto(array $p): array
{
    $precoVista = $p['precoVista'] !== null ? (float)$p['precoVista'] : 0;
    $precoParcelado = $p['precoParcelado'] !== null
        ? (float)$p['precoParcelado']
        : $precoVista;

    $estoque = (int)($p['estoque'] ?? 0);

    return [
        'id' => (int)$p['id'],
        'sku' => (string)($p['sku'] ?? ''),
        'codigoMakita' => (string)($p['codigo_makita'] ?? ''),
        'nome' => (string)($p['nome'] ?? ''),
        'descricao' => (string)($p['descricao'] ?? ''),
        'marca' => (string)($p['marca'] ?? ''),
        'aplicacao' => (string)($p['aplicacao'] ?? ''),
        'linha' => (string)($p['linha'] ?? ''),
        'codigoAlternativo' => (string)($p['codigo_alternativo'] ?? ''),
        'pesoKg' => $p['peso_kg'] !== null ? (float)$p['peso_kg'] : null,
        'ncm' => (string)($p['ncm'] ?? ''),
        'precoVista' => $precoVista,
        'precoParcelado' => $precoParcelado,
        'precoDe' => 0,
        'img' => '../padrao.png',
        'estoque' => $estoque,

        // Estoque 0 NÃO significa indisponível.
        'disponivel' => true,
        'sobEncomenda' => $estoque <= 0,

        'categoria' => (string)($p['categoria'] ?? ''),
        'categoriaSlug' => (string)($p['categoriaSlug'] ?? ''),
        'subcategoria' => (string)($p['subcategoria'] ?? ''),
        'subcategoriaSlug' => (string)($p['subcategoriaSlug'] ?? '')
    ];
}
