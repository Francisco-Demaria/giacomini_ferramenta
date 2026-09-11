<?php

require_once __DIR__ . '/../includes/proteger.php';
require_once __DIR__ . '/../../config/banco.php';

$titulo = 'Produtos';
$paginaAtual = 'Produtos';
$descricao = 'Gerencie os produtos cadastrados no catálogo.';

$busca = trim($_GET['busca'] ?? '');

$pagina = max(
    1,
    (int) ($_GET['pagina'] ?? 1)
);

$porPagina = 25;


/*
|--------------------------------------------------------------------------
| Contagem
|--------------------------------------------------------------------------
*/

if ($busca !== '') {

    $stmt = $pdo->prepare("
        SELECT COUNT(*) AS total
        FROM produtos
        WHERE
            nome LIKE :busca
            OR sku LIKE :busca
            OR codigo_makita LIKE :busca
    ");

    $stmt->execute([
        ':busca' => '%' . $busca . '%'
    ]);

} else {

    $stmt = $pdo->query("
        SELECT COUNT(*) AS total
        FROM produtos
    ");
}

$totalProdutos = (int) $stmt->fetch()['total'];

$totalPaginas = max(
    1,
    (int) ceil($totalProdutos / $porPagina)
);

$pagina = min(
    $pagina,
    $totalPaginas
);

$offset = ($pagina - 1) * $porPagina;


/*
|--------------------------------------------------------------------------
| Produtos
|--------------------------------------------------------------------------
*/

if ($busca !== '') {

    $stmt = $pdo->prepare("
        SELECT
            p.id,
            p.sku,
            p.codigo_makita,
            p.nome,
            p.marca,
            p.linha,
            p.ativo,
            COALESCE(e.quantidade, 0) AS estoque

        FROM produtos p

        LEFT JOIN estoque e
            ON e.produto_id = p.id

        WHERE
            p.nome LIKE :busca
            OR p.sku LIKE :busca
            OR p.codigo_makita LIKE :busca

        ORDER BY p.id DESC

        LIMIT :limite
        OFFSET :offset
    ");

    $stmt->bindValue(
        ':busca',
        '%' . $busca . '%',
        PDO::PARAM_STR
    );

} else {

    $stmt = $pdo->prepare("
        SELECT
            p.id,
            p.sku,
            p.codigo_makita,
            p.nome,
            p.marca,
            p.linha,
            p.ativo,
            COALESCE(e.quantidade, 0) AS estoque

        FROM produtos p

        LEFT JOIN estoque e
            ON e.produto_id = p.id

        ORDER BY p.id DESC

        LIMIT :limite
        OFFSET :offset
    ");
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

$produtos = $stmt->fetchAll();

?>

<!DOCTYPE html>

<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        Produtos | Giacomini Admin
    </title>

    <link
        rel="stylesheet"
        href="/admin/css/admin.css"
    >

</head>

<body>

<div class="admin-layout">

    <?php require __DIR__ . '/../includes/sidebar.php'; ?>

    <main class="admin-main">

        <?php require __DIR__ . '/../includes/header.php'; ?>

        <section class="admin-content">

            <div class="page-toolbar">

                <form
                    method="GET"
                    class="search-form"
                >

                    <input
                        type="search"
                        name="busca"
                        placeholder="Buscar por nome, SKU ou código Makita..."
                        value="<?= htmlspecialchars(
                            $busca,
                            ENT_QUOTES,
                            'UTF-8'
                        ) ?>"
                    >

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Buscar
                    </button>

                    <?php if ($busca !== ''): ?>

                        <a
                            href="/admin/pages/produtos.php"
                            class="btn btn-secondary"
                        >
                            Limpar
                        </a>

                    <?php endif; ?>

                </form>

                <a
                    href="/admin/pages/novo-produto.php"
                    class="btn btn-primary"
                >
                    + Novo produto
                </a>

            </div>


            <div class="admin-panel">

                <div class="panel-header">

                    <div>

                        <h2>
                            Catálogo
                        </h2>

                        <p>
                            <?= number_format(
                                $totalProdutos,
                                0,
                                ',',
                                '.'
                            ) ?>
                            produto(s) encontrado(s)
                        </p>

                    </div>

                </div>


                <div class="table-wrapper">

                    <table class="admin-table">

                        <thead>

                            <tr>

                                <th>ID</th>
                                <th>SKU</th>
                                <th>Código Makita</th>
                                <th>Produto</th>
                                <th>Marca</th>
                                <th>Linha</th>
                                <th>Estoque</th>
                                <th>Status</th>
                                <th>Ações</th>

                            </tr>

                        </thead>

                        <tbody>

                        <?php if (!$produtos): ?>

                            <tr>

                                <td colspan="9">
                                    Nenhum produto encontrado.
                                </td>

                            </tr>

                        <?php else: ?>

                            <?php foreach ($produtos as $produto): ?>

                                <tr>

                                    <td>
                                        <?= (int) $produto['id'] ?>
                                    </td>

                                    <td>
                                        <?= htmlspecialchars(
                                            $produto['sku'],
                                            ENT_QUOTES,
                                            'UTF-8'
                                        ) ?>
                                    </td>

                                    <td>
                                        <?= htmlspecialchars(
                                            $produto['codigo_makita'] ?? '-',
                                            ENT_QUOTES,
                                            'UTF-8'
                                        ) ?>
                                    </td>

                                    <td>

                                        <strong>
                                            <?= htmlspecialchars(
                                                $produto['nome'],
                                                ENT_QUOTES,
                                                'UTF-8'
                                            ) ?>
                                        </strong>

                                    </td>

                                    <td>
                                        <?= htmlspecialchars(
                                            $produto['marca'] ?? '-',
                                            ENT_QUOTES,
                                            'UTF-8'
                                        ) ?>
                                    </td>

                                    <td>
                                        <?= htmlspecialchars(
                                            $produto['linha'] ?? '-',
                                            ENT_QUOTES,
                                            'UTF-8'
                                        ) ?>
                                    </td>

                                    <td>
                                        <?= number_format(
                                            (int) $produto['estoque'],
                                            0,
                                            ',',
                                            '.'
                                        ) ?>
                                    </td>

                                    <td>

                                        <?php if ((int) $produto['ativo'] === 1): ?>

                                            <span class="badge badge-success">
                                                Ativo
                                            </span>

                                        <?php else: ?>

                                            <span class="badge badge-danger">
                                                Inativo
                                            </span>

                                        <?php endif; ?>

                                    </td>

                                    <td>

                                        <a
                                            href="/admin/pages/editar-produto.php?id=<?= (int) $produto['id'] ?>"
                                            class="btn btn-secondary"
                                        >
                                            Editar
                                        </a>

                                    </td>

                                </tr>

                            <?php endforeach; ?>

                        <?php endif; ?>

                        </tbody>

                    </table>

                </div>


                <?php if ($totalPaginas > 1): ?>

                    <div class="pagination">

                        <?php if ($pagina > 1): ?>

                            <a
                                href="?pagina=<?= $pagina - 1 ?>&busca=<?= urlencode($busca) ?>"
                                class="btn btn-secondary"
                            >
                                ← Anterior
                            </a>

                        <?php endif; ?>


                        <span>
                            Página
                            <?= $pagina ?>
                            de
                            <?= $totalPaginas ?>
                        </span>


                        <?php if ($pagina < $totalPaginas): ?>

                            <a
                                href="?pagina=<?= $pagina + 1 ?>&busca=<?= urlencode($busca) ?>"
                                class="btn btn-secondary"
                            >
                                Próxima →
                            </a>

                        <?php endif; ?>

                    </div>

                <?php endif; ?>

            </div>

        </section>

    </main>

</div>

</body>

</html>