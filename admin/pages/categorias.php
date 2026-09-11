<?php

require_once __DIR__ . '/../includes/proteger.php';
require_once __DIR__ . '/../../config/banco.php';

$categorias = $pdo->query("
    SELECT
        c.id,
        c.nome,
        c.slug,
        c.ativo,
        COUNT(p.id) AS total_produtos
    FROM categorias c
    LEFT JOIN produtos p
        ON p.categoria_id = c.id
    GROUP BY
        c.id,
        c.nome,
        c.slug,
        c.ativo
    ORDER BY c.nome ASC
")->fetchAll();

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>

<main class="admin-main">

    <div class="page-header">

        <div>
            <h1>Categorias</h1>

            <p>
                Categorias utilizadas no catálogo.
            </p>
        </div>

    </div>

    <section class="panel">

        <div class="table-wrapper">

            <table class="admin-table">

                <thead>

                    <tr>
                        <th>ID</th>
                        <th>Categoria</th>
                        <th>Slug</th>
                        <th>Produtos</th>
                        <th>Status</th>
                    </tr>

                </thead>

                <tbody>

                    <?php foreach ($categorias as $categoria): ?>

                        <tr>

                            <td>
                                <?= (int)$categoria['id'] ?>
                            </td>

                            <td>
                                <strong>
                                    <?= htmlspecialchars(
                                        $categoria['nome']
                                    ) ?>
                                </strong>
                            </td>

                            <td>
                                <code>
                                    <?= htmlspecialchars(
                                        $categoria['slug']
                                    ) ?>
                                </code>
                            </td>

                            <td>
                                <?= (int)$categoria[
                                    'total_produtos'
                                ] ?>
                            </td>

                            <td>

                                <?php if ($categoria['ativo']): ?>

                                    <span class="badge badge-success">
                                        Ativa
                                    </span>

                                <?php else: ?>

                                    <span class="badge badge-danger">
                                        Inativa
                                    </span>

                                <?php endif; ?>

                            </td>

                        </tr>

                    <?php endforeach; ?>

                </tbody>

            </table>

        </div>

    </section>

</main>