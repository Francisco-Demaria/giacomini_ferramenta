<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');

try {

    require_once __DIR__ . '/../config/banco.php';

    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('Conexão com o catálogo indisponível.');
    }

    /*
    |--------------------------------------------------------------------------
    | Parâmetros
    |--------------------------------------------------------------------------
    */

    $pagina = max(
        1,
        (int) ($_GET['pagina'] ?? 1)
    );

    $porPagina = min(
        48,
        max(
            1,
            (int) ($_GET['porPagina'] ?? 24)
        )
    );

    $busca = trim(
        (string) ($_GET['busca'] ?? '')
    );

    $categoria = trim(
        (string) ($_GET['categoria'] ?? '')
    );

    $subcategoria = trim(
        (string) ($_GET['subcategoria'] ?? '')
    );

    $offset = ($pagina - 1) * $porPagina;


    /*
    |--------------------------------------------------------------------------
    | WHERE
    |--------------------------------------------------------------------------
    */

    $where = [
        'p.ativo = 1'
    ];

    $parametros = [];


    /*
    |--------------------------------------------------------------------------
    | Busca
    |--------------------------------------------------------------------------
    */

    if ($busca !== '') {

        $where[] = '(
            p.nome LIKE :busca_nome
            OR p.sku LIKE :busca_sku
            OR p.codigo_makita LIKE :busca_codigo
        )';

        $termo = '%' . $busca . '%';

        $parametros[':busca_nome'] = $termo;
        $parametros[':busca_sku'] = $termo;
        $parametros[':busca_codigo'] = $termo;
    }


    /*
    |--------------------------------------------------------------------------
    | Categoria
    |--------------------------------------------------------------------------
    */

    if ($categoria !== '') {

        $where[] = 'c.slug = :categoria';

        $parametros[':categoria'] = $categoria;
    }


    /*
    |--------------------------------------------------------------------------
    | Subcategoria
    |--------------------------------------------------------------------------
    */

    if ($subcategoria !== '') {

        $where[] = 'sc.slug = :subcategoria';

        $parametros[':subcategoria'] = $subcategoria;
    }


    $whereSql = implode(
        ' AND ',
        $where
    );


    /*
    |--------------------------------------------------------------------------
    | Total
    |--------------------------------------------------------------------------
    */

    $sqlTotal = "
        SELECT COUNT(*)
        FROM produtos p

        LEFT JOIN categorias c
            ON c.id = p.categoria_id

        LEFT JOIN subcategorias sc
            ON sc.id = p.subcategoria_id

        WHERE {$whereSql}
    ";

    $stmtTotal = $pdo->prepare($sqlTotal);

    foreach ($parametros as $nome => $valor) {
        $stmtTotal->bindValue(
            $nome,
            $valor,
            PDO::PARAM_STR
        );
    }

    $stmtTotal->execute();

    $total = (int) $stmtTotal->fetchColumn();


    /*
    |--------------------------------------------------------------------------
    | Produtos da página
    |--------------------------------------------------------------------------
    */

    $sql = "
        SELECT

            p.sku,
            p.nome,
            p.marca,

            COALESCE(c.nome, '') AS categoria,

            COALESCE(c.slug, '') AS categoriaSlug,

            COALESCE(sc.nome, '') AS subcategoria,

            COALESCE(sc.slug, '') AS subcategoriaSlug,

            p.preco_vista AS precoVista,

            p.preco_parcelado AS precoParcelado,

            p.descricao,

            p.peso_kg AS pesoKg,

            p.aplicacao,

            p.linha,

            p.codigo_makita

        FROM produtos p

        LEFT JOIN categorias c
            ON c.id = p.categoria_id

        LEFT JOIN subcategorias sc
            ON sc.id = p.subcategoria_id

        WHERE {$whereSql}

        ORDER BY p.nome ASC

        LIMIT :limite
        OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);


    foreach ($parametros as $nome => $valor) {

        $stmt->bindValue(
            $nome,
            $valor,
            PDO::PARAM_STR
        );
    }


    $stmt->bindValue(
        ':limite',
        $porPagina,
        PDO::PARAM_INT
    );

    $stmt->bindValue(
        ':offset',
        $offset,
        PDO::PARAM_INT
    );


    $stmt->execute();


    /*
    |--------------------------------------------------------------------------
    | Normalização
    |--------------------------------------------------------------------------
    */

    $produtos = array_map(

        static function (array $produto): array {

            return [

                'sku' =>
                    $produto['sku'] ?? '',

                'nome' =>
                    $produto['nome'] ?? '',

                'marca' =>
                    $produto['marca'] ?? '',

                'categoria' =>
                    $produto['categoria'] ?? '',

                'categoriaSlug' =>
                    $produto['categoriaSlug'] ?? '',

                'subcategoria' =>
                    $produto['subcategoria'] ?? '',

                'subcategoriaSlug' =>
                    $produto['subcategoriaSlug'] ?? '',

                'precoVista' =>
                    $produto['precoVista'] ?? null,

                'precoParcelado' =>
                    $produto['precoParcelado'] ?? null,

                'imagem' => '',

                /*
                 * Importante:
                 *
                 * estoque 0 NÃO significa
                 * produto indisponível.
                 *
                 * A Giacomini pode solicitar
                 * o produto ao distribuidor.
                 */
                'disponivel' => true,

                'descricao' =>
                    $produto['descricao'] ?? '',

                'pesoKg' =>
                    $produto['pesoKg'] ?? null,

                'dimensoes' => '',

                'aplicacao' =>
                    $produto['aplicacao'] ?? '',

                'linha' =>
                    $produto['linha'] ?? '',

                'codigoMakita' =>
                    $produto['codigo_makita'] ?? ''
            ];

        },

        $stmt->fetchAll(PDO::FETCH_ASSOC)
    );


    /*
    |--------------------------------------------------------------------------
    | Paginação
    |--------------------------------------------------------------------------
    */

    $totalPaginas = max(
        1,
        (int) ceil(
            $total / $porPagina
        )
    );


    /*
    |--------------------------------------------------------------------------
    | Resposta
    |--------------------------------------------------------------------------
    */

    echo json_encode(

        [

            'produtos' => $produtos,

            'paginacao' => [

                'pagina' =>
                    $pagina,

                'porPagina' =>
                    $porPagina,

                'total' =>
                    $total,

                'totalPaginas' =>
                    $totalPaginas,

                'temAnterior' =>
                    $pagina > 1,

                'temProxima' =>
                    $pagina < $totalPaginas
            ]

        ],

        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES

    );

} catch (Throwable $e) {

    error_log(
        'API de produtos: ' .
        $e->getMessage()
    );

    http_response_code(500);

    echo json_encode(

        [
            'erro' =>
                'Não foi possível carregar o catálogo no momento.'
        ],

        JSON_UNESCAPED_UNICODE

    );
}