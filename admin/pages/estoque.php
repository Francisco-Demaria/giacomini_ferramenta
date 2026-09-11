<?php

require_once __DIR__ . '/../includes/proteger.php';
require_once __DIR__ . '/../../config/banco.php';

$busca = trim($_GET['busca'] ?? '');
$pagina = max(1, (int)($_GET['pagina'] ?? 1));
$porPagina = 25;
$offset = ($pagina - 1) * $porPagina;

$where = '';
$params = [];

if ($busca !== '') {
    $where = "
        WHERE
            p.nome LIKE :busca
            OR p.sku LIKE :busca
            OR p.codigo_makita LIKE :busca
    ";

    $params[':busca'] = '%' . $busca . '%';
}

$stmtTotal = $pdo->prepare("
    SELECT COUNT(*)
    FROM produtos p
    LEFT JOIN estoque e ON e.produto_id = p.id
    $where
");

$stmtTotal->execute($params);
$total = (int)$stmtTotal->fetchColumn();

$totalPaginas = max(1, (int)ceil($total / $porPagina));

$stmt = $pdo->prepare("
    SELECT
        p.id,
        p.sku,
        p.codigo_makita,
        p.nome,
        p.marca,
        p.linha,
        p.ativo,
        COALESCE(e.quantidade, 0) AS quantidade,
        COALESCE(e.estoque_minimo, 0) AS estoque_minimo,
        COALESCE(e.estoque_maximo, 0) AS estoque_maximo
    FROM produtos p
    LEFT JOIN estoque e ON e.produto_id = p.id
    $where
    ORDER BY p.nome ASC
    LIMIT :limite OFFSET :offset
");

foreach ($params as $chave => $valor) {
    $stmt->bindValue($chave, $valor, PDO::PARAM_STR);
}

$stmt->bindValue(':limite', $porPagina, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

$stmt->execute();

$produtos = $stmt->fetchAll();

function escapar($valor): string
{
    return htmlspecialchars((string)$valor, ENT_QUOTES, 'UTF-8');
}

function classeEstoque(int $quantidade, int $minimo): string
{
    if ($quantidade <= 0) {
        return 'estoque-zero';
    }

    if ($minimo > 0 && $quantidade <= $minimo) {
        return 'estoque-baixo';
    }

    return 'estoque-normal';
}

?>

<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Estoque | Giacomini Ferramentas</title>

    <link rel="stylesheet" href="/admin/css/admin.css">
</head>

<body>

<?php require_once __DIR__ . '/../includes/sidebar.php'; ?>

<div class="admin-main">

    <?php require_once __DIR__ . '/../includes/header.php'; ?>

    <main class="admin-content">

        <div class="page-header">
            <div>
                <h1>Estoque</h1>
                <p>Controle de quantidade e níveis de estoque.</p>
            </div>
        </div>

        <section class="admin-panel">

            <form method="GET" class="admin-toolbar">

                <div class="search-box">
                    <input
                        type="search"
                        name="busca"
                        placeholder="Buscar produto ou código..."
                        value="<?= escapar($busca) ?>"
                    >
                </div>

                <button type="submit" class="btn btn-primary">
                    Buscar
                </button>

                <?php if ($busca !== ''): ?>

                    <a href="/admin/pages/estoque.php" class="btn btn-secondary">
                        Limpar
                    </a>

                <?php endif; ?>

            </form>

            <div class="table-wrapper">

                <table class="admin-table">

                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Produto</th>
                            <th>Marca</th>
                            <th>Linha</th>
                            <th>Estoque</th>
                            <th>Mínimo</th>
                            <th>Máximo</th>
                            <th>Status</th>
                            <th>Ação</th>
                        </tr>
                    </thead>

                    <tbody>

                    <?php if (!$produtos): ?>

                        <tr>
                            <td colspan="9" class="empty-state">
                                Nenhum produto encontrado.
                            </td>
                        </tr>

                    <?php else: ?>

                        <?php foreach ($produtos as $produto): ?>

                            <?php
                            $quantidade = (int)$produto['quantidade'];
                            $minimo = (int)$produto['estoque_minimo'];
                            $maximo = (int)$produto['estoque_maximo'];
                            ?>

                            <tr>

                                <td>
                                    <strong>
                                        <?= escapar($produto['codigo_makita'] ?: $produto['sku']) ?>
                                    </strong>
                                </td>

                                <td>
                                    <?= escapar($produto['nome']) ?>
                                </td>

                                <td>
                                    <?= escapar($produto['marca']) ?>
                                </td>

                                <td>
                                    <?= escapar($produto['linha']) ?>
                                </td>

                                <td>
                                    <span class="estoque-badge <?= classeEstoque($quantidade, $minimo) ?>">
                                        <?= $quantidade ?>
                                    </span>
                                </td>

                                <td>
                                    <?= $minimo ?>
                                </td>

                                <td>
                                    <?= $maximo ?>
                                </td>

                                <td>

                                    <?php if (!$produto['ativo']): ?>

                                        <span class="badge badge-muted">
                                            Inativo
                                        </span>

                                    <?php elseif ($quantidade <= 0): ?>

                                        <span class="badge badge-danger">
                                            Sem estoque
                                        </span>

                                    <?php elseif ($minimo > 0 && $quantidade <= $minimo): ?>

                                        <span class="badge badge-warning">
                                            Estoque baixo
                                        </span>

                                    <?php else: ?>

                                        <span class="badge badge-success">
                                            Normal
                                        </span>

                                    <?php endif; ?>

                                </td>

                                <td>

                                    <a
                                        href="/admin/pages/editar-produto.php?id=<?= (int)$produto['id'] ?>"
                                        class="btn btn-small btn-secondary"
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

                    <?php for ($i = 1; $i <= $totalPaginas; $i++): ?>

                        <a
                            href="?pagina=<?= $i ?>&busca=<?= urlencode($busca) ?>"
                            class="<?= $i === $pagina ? 'active' : '' ?>"
                        >
                            <?= $i ?>
                        </a>

                    <?php endfor; ?>

                </div>

            <?php endif; ?>

        </section>

    </main>

</div>

</body>
</html>